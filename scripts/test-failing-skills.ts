import 'dotenv/config';
import { invokeLLM } from '../server/_core/llm.ts';
import mysql from 'mysql2/promise';

async function testSkills() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'skill_marketplace',
  });

  const failingIds = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 22];

  for (const id of failingIds) {
    const [[skill]] = await connection.query('SELECT id, title, description, skillMd FROM skills WHERE id = ?', [id]) as any;
    
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
{"prompts": ["...", "...", "..."]}
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

      const raw = res.choices?.[0]?.message?.content ?? "";
      const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
      
      let prompts: string[] = [];
      try {
        const direct = JSON.parse(rawStr);
        if (Array.isArray(direct)) {
          prompts = direct.filter((s): s is string => typeof s === "string");
        } else if (direct?.prompts && Array.isArray(direct.prompts)) {
          prompts = direct.prompts.filter((s: unknown): s is string => typeof s === "string");
        }
      } catch {
        const jsonMatch = rawStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            if (Array.isArray(extracted)) {
              prompts = extracted.filter((s): s is string => typeof s === "string");
            } else if (extracted?.prompts && Array.isArray(extracted.prompts)) {
              prompts = extracted.prompts.filter((s: unknown): s is string => typeof s === "string");
            }
          } catch { /* ignore */ }
        }
      }

      const safePrompts = prompts
        .filter(p => typeof p === "string" && p.length >= 4 && !/<[a-zA-Z]/.test(p))
        .slice(0, 3);

      if (safePrompts.length > 0) {
        console.log(`✓ Skill ${id} (${skill.title}): ${safePrompts.join(', ')}`);
        
        // Update database
        let cfg: Record<string, unknown> = {};
        if (skill.uiConfig) {
          try { cfg = JSON.parse(skill.uiConfig); } catch { /* ignore */ }
        }
        cfg.examplePrompts = safePrompts;
        await connection.query('UPDATE skills SET uiConfig = ? WHERE id = ?', [JSON.stringify(cfg), id]);
      } else {
        console.log(`✗ Skill ${id} (${skill.title}): PARSING FAILED - raw: ${rawStr.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`✗ Skill ${id} (${skill.title}): ERROR - ${err.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  await connection.end();
}

testSkills();
