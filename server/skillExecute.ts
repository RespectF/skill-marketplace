/**
 * Skill 执行路由 – 通过 SSE 流式返回 LLM 生成结果
 *
 * POST /api/skills/:id/execute
 *   Body: { inputs: Record<string, string> }
 *   Response: text/event-stream (SSE)
 *
 * 将 SKILL.md 作为 system prompt 传给 LLM，用户输入作为 user message，
 * 以流式方式将 LLM 的回复逐 token 推送给前端。
 */

import type { Express, Request, Response } from "express";
import { getSkillById } from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function sseWrite(res: Response, event: string, data: string) {
  res.write(`event: ${event}\ndata: ${data}\n\n`);
}

function sseError(res: Response, message: string) {
  sseWrite(res, "error", JSON.stringify({ message }));
  res.end();
}

// ─── Build user message from inputs ──────────────────────────────────────────

function buildUserMessage(inputs: Record<string, string>): string {
  const entries = Object.entries(inputs).filter(([, v]) => v?.trim());
  if (entries.length === 0) return "请根据你的技能说明执行任务。";

  if (entries.length === 1) {
    const [key, value] = entries[0];
    // If single generic field, just return the value directly
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
    .slice(-20); // Keep last 20 messages to avoid token overflow
}

// ─── Streaming LLM call ───────────────────────────────────────────────────────

async function streamLLM(
  systemPrompt: string,
  userMessage: string,
  res: Response,
  history: HistoryMessage[] = []
): Promise<void> {
  // Use custom LLM endpoint (Claude-compatible Anthropic proxy)
  const apiUrl = `${ENV.customLlmApiUrl.replace(/\/$/, "")}/v1/messages`;

  // Build messages array: history + current user message (Anthropic format)
  const historyMessages = history.map((m) => ({ role: m.role, content: m.content }));

  const payload = {
    model: "claude-3-7-sonnet-20250219",
    stream: true,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      ...historyMessages,
      { role: "user", content: userMessage },
    ],
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

    // Process complete SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Anthropic SSE format: "event: ..." lines followed by "data: {...}" lines
      // We care about content_block_delta events
      if (trimmed.startsWith("data:")) {
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const chunk = JSON.parse(jsonStr);
          // Anthropic streaming: content_block_delta with delta.type = text_delta
          if (chunk?.type === "content_block_delta" && chunk?.delta?.type === "text_delta") {
            const text = chunk.delta.text;
            if (text) sseWrite(res, "delta", JSON.stringify({ text }));
          }
          // Also handle thinking_delta (extended thinking) — skip it
          // Handle OpenAI-compatible format as fallback
          const openAiDelta = chunk?.choices?.[0]?.delta?.content;
          if (openAiDelta) {
            sseWrite(res, "delta", JSON.stringify({ text: openAiDelta }));
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
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

// ─── Route registration ───────────────────────────────────────────────────────

export function registerSkillExecuteRoute(app: Express) {
  // NOTE: Vercel mounts this at /api/* (via api/index.ts), so /skills here becomes /api/skills externally
  app.post("/skills/:id/execute", async (req: Request, res: Response) => {
    // ── Auth check ──
    let user = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "请先登录后再使用技能" });
      return;
    }

    // ── Parse params ──
    const skillId = parseInt(req.params.id, 10);
    if (isNaN(skillId)) {
      res.status(400).json({ error: "无效的技能 ID" });
      return;
    }

    const inputs: Record<string, string> = req.body?.inputs ?? {};
    const history = sanitizeHistory(req.body?.history);

    // ── Load skill ──
    const skill = await getSkillById(skillId);
    if (!skill) {
      res.status(404).json({ error: "技能不存在" });
      return;
    }

    // ── Set up SSE ──
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send start event
    sseWrite(res, "start", JSON.stringify({ skillId: skill.id, title: skill.title }));

    try {
      const systemPrompt = buildSystemPrompt(skill.title, skill.skillMd);
      const userMessage = buildUserMessage(inputs);

      await streamLLM(systemPrompt, userMessage, res, history);

      // Send done event
      sseWrite(res, "done", JSON.stringify({ success: true }));
    } catch (err: any) {
      console.error("[SkillExecute] Error:", err);
      sseError(res, err?.message ?? "执行失败，请稍后重试");
      return;
    }

    res.end();
  });
}
