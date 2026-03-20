import 'dotenv/config';
import { invokeLLM } from '../server/_core/llm.ts';
import { getSkillById } from '../server/db.ts';

async function test() {
  const skill = await getSkillById(6);
  console.log("Skill title:", skill?.title);
  console.log("Skill description:", skill?.description);
  console.log("SkillMd length:", skill?.skillMd?.length);
  console.log("SkillMd preview:", skill?.skillMd?.slice(0, 200));
  
  if (!skill) {
    console.error("Skill not found");
    return;
  }

  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一个帮助用户快速上手使用 Claude Code Skill 的助手。
请根据提供的 SKILL.md 内容，生成 3 条具体、实用的示例提示词。
要求：
- 每条提示词都是一个真实用户可能发出的请求
- 语言自然、直接，不要太正式
- 每条 10-30 字
- 必须严格返回如下 JSON 格式，不要包含任何其他内容：
{"prompts": ["...", "...", "...", "..."]}
只返回纯 JSON，不要加任何解释文字。`,
        },
        {
          role: "user",
          content: `Skill 名称：${skill.title}
Skill 描述：${skill.description}
SKILL.md 内容：
${skill.skillMd?.slice(0, 2000)}

请生成 3 条示例提示词，仅返回 JSON：`,
        },
      ],
    });

    console.log("\nLLM Response content:", res.choices?.[0]?.message?.content);
    
    // Test parsing logic
    const raw = res.choices?.[0]?.message?.content ?? "";
    const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    console.log("\nRaw string:", rawStr);
    
    let prompts: string[] = [];
    try {
      const direct = JSON.parse(rawStr);
      if (Array.isArray(direct)) {
        prompts = direct.filter((s): s is string => typeof s === "string");
      } else if (direct?.prompts && Array.isArray(direct.prompts)) {
        prompts = direct.prompts.filter((s: unknown): s is string => typeof s === "string");
      }
      console.log("Parsed prompts:", prompts);
    } catch (e) {
      console.log("Direct parse failed:", e.message);
      const jsonMatch = rawStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          if (Array.isArray(extracted)) {
            prompts = extracted.filter((s): s is string => typeof s === "string");
          } else if (extracted?.prompts && Array.isArray(extracted.prompts)) {
            prompts = extracted.prompts.filter((s: unknown): s is string => typeof s === "string");
          }
          console.log("Extracted prompts:", prompts);
        } catch (e2) {
          console.log("Extraction also failed:", e2.message);
        }
      }
    }

    const safePrompts = prompts
      .filter(p => typeof p === "string" && p.length >= 4 && !/<[a-zA-Z]/.test(p))
      .slice(0, 3);
    console.log("Safe prompts:", safePrompts);
    
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
