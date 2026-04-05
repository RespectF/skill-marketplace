import { getSkillById } from "./db.js";
import { ENV } from "./_core/env.js";
import { sdk } from "./_core/sdk.js";

// ─── Build user message from inputs ──────────────────────────────────────────
function buildUserMessage(inputs: Record<string, string>): string {
  const entries = Object.entries(inputs).filter(([, v]) => v?.trim());
  if (entries.length === 0) return "请根据你的技能说明执行任务。";

  if (entries.length === 1) {
    const [key, value] = entries[0];
    if (["task", "input", "content", "text", "prompt", "任务描述", "输入内容"].includes(key)) {
      return value;
    }
    return `${key}：${value}`;
  }

  return entries.map(([k, v]) => `**${k}**：${v}`).join("\n\n");
}

// ─── Validate history messages ────────────────────────────────────────────────
type HistoryMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(history: unknown): HistoryMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is HistoryMessage =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-20);
}

// ─── Build system prompt from SKILL.md ───────────────────────────────────────
function buildSystemPrompt(skillTitle: string, skillMd: string): string {
  return `你是一个专业的 AI 助手，正在执行名为「${skillTitle}」的 Claude Code Skill。

以下是该 Skill 的完整说明文档（SKILL.md）：

---
${skillMd}
---

请严格按照上述 Skill 说明的要求和格式，处理用户的输入并生成高质量的输出结果。
- 直接输出结果，不要解释你在做什么
- 使用 Markdown 格式让输出更易读
- 输出语言与用户输入语言保持一致（默认中文）`;
}

// ─── Streaming LLM call (重构为接受 sseWrite 回调函数) ──────────────────────────
async function streamLLM(
  systemPrompt: string,
  userMessage: string,
  history: HistoryMessage[],
  sseWrite: (event: string, data: string) => void
): Promise<void> {
  const apiUrl = `${ENV.customLlmApiUrl.replace(/\/$/, "")}/v1/messages`;
  const historyMessages = history.map((m) => ({ role: m.role, content: m.content }));

  const payload = {
    model: "claude-3-7-sonnet-20250219",
    stream: true,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [...historyMessages, { role: "user", content: userMessage }],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.customLlmApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} – ${errorText}`);
  }

  if (!response.body) {
    throw new Error("No response body from LLM API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const chunk = JSON.parse(jsonStr);
        if (chunk?.type === "content_block_delta" && chunk?.delta?.type === "text_delta") {
          const text = chunk.delta.text;
          if (text) sseWrite("delta", JSON.stringify({ text }));
        }
        const openAiDelta = chunk?.choices?.[0]?.delta?.content;
        if (openAiDelta) {
          sseWrite("delta", JSON.stringify({ text: openAiDelta }));
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

// ─── 标准 Web Route Handler (替代原来的 app.post) ───────────────────────────────
export async function handleSkillExecute(req: Request) {
  // 1. 获取动态路由中的 ID
  const url = new URL(req.url);
  // 在 Vercel 中，/api/skills/[id]/execute 这种结构，id 会被注入到 searchParams 中
  // 如果取不到，尝试从 url.pathname 截取 (兜底处理)
  let idStr = url.searchParams.get("id");
  if (!idStr) {
    const parts = url.pathname.split("/");
    idStr = parts[parts.indexOf("skills") + 1];
  }

  const skillId = parseInt(idStr || "", 10);
  if (isNaN(skillId)) {
    return Response.json({ error: "无效的技能 ID" }, { status: 400 });
  }

  // 2. 校验登录
  try {
    await sdk.authenticateRequest(req);
  } catch {
    return Response.json({ error: "请先登录后再使用技能" }, { status: 401 });
  }

  // 3. 解析请求体
  let body: any = {};
  try {
    body = await req.json();
  } catch {} // 忽略空 body 报错

  const inputs: Record<string, string> = body.inputs ?? {};
  const history = sanitizeHistory(body.history);

  // 4. 检查技能是否存在
  const skill = await getSkillById(skillId);
  if (!skill) {
    return Response.json({ error: "技能不存在" }, { status: 404 });
  }

  // 5. 构建 SSE 流 (核心重构点)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 封装流式写入方法
      const sseWrite = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };
      const sseError = (message: string) => {
        sseWrite("error", JSON.stringify({ message }));
        controller.close();
      };

      try {
        // 发送开始事件
        sseWrite("start", JSON.stringify({ skillId: skill.id, title: skill.title }));

        const systemPrompt = buildSystemPrompt(skill.title, skill.skillMd);
        const userMessage = buildUserMessage(inputs);

        // 调用流式 LLM
        await streamLLM(systemPrompt, userMessage, history, sseWrite);

        // 发送完成事件
        sseWrite("done", JSON.stringify({ success: true }));
      } catch (err: any) {
        console.error("[SkillExecute] Error:", err);
        sseError(err?.message ?? "执行失败，请稍后重试");
      } finally {
        // 确保流被关闭
        try { controller.close(); } catch {}
      }
    },
  });

  // 返回原生的 Response，并打上 SSE 必要的 Header
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}