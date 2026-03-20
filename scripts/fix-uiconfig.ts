import 'dotenv/config';
import { invokeLLM } from '../server/_core/llm.ts';
import mysql from 'mysql2/promise';

async function fixUiConfig() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'skill_marketplace',
  });

  // Get all skills
  const [skills] = await connection.query('SELECT id, title, description, skillMd, uiConfig FROM skills') as any;

  for (const skill of skills) {
    try {
      let cfg = {};
      if (skill.uiConfig) {
        try { cfg = JSON.parse(skill.uiConfig); } catch { /* ignore */ }
      }

      // Check if this skill needs uiConfig fix
      const needsFix = !cfg.theme || !cfg.features || cfg.features?.length === 0;

      if (needsFix) {
        console.log(`Fixing skill ${skill.id}: ${skill.title}...`);

        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一个专业的 UI 设计师，负责根据 Claude Code Skill 的功能特性，生成个性化的可视化界面配置。
请根据 Skill 的内容，生成一个 JSON 配置，描述该 Skill 的详情页应该如何展示。

JSON 格式如下：
{
  "theme": "颜色主题，如 purple/blue/green/orange/pink/teal/red",
  "icon": "emoji 图标，代表该 Skill 的功能",
  "heroTitle": "详情页大标题（可以和 title 不同，更有吸引力）",
  "heroSubtitle": "副标题，一句话说明核心价值",
  "features": [
    { "icon": "emoji", "title": "特性标题", "desc": "特性描述" }
  ],
  "useCases": ["使用场景1", "使用场景2", "使用场景3"],
  "inputFields": [
    { "id": "字段ID", "label": "字段标签", "type": "text|textarea|file|select", "placeholder": "占位符", "options": ["选项1"] }
  ],
  "outputType": "text|code|image|document|chart",
  "steps": ["步骤1", "步骤2", "步骤3"],
  "tags": ["标签1", "标签2"]
}

inputFields 是用户使用该 Skill 时需要填写的输入字段，根据 Skill 的功能来设计（2-4个字段）。
请根据 Skill 的实际功能来设计，不要千篇一律。`,
            },
            {
              role: "user",
              content: `Skill 名称：${skill.title}
Skill 描述：${skill.description}
SKILL.md 内容：
${(skill.skillMd || '').slice(0, 3000)}

请生成个性化 UI 配置 JSON：`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "skill_ui_config",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  theme: { type: "string" },
                  icon: { type: "string" },
                  heroTitle: { type: "string" },
                  heroSubtitle: { type: "string" },
                  features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string" },
                        title: { type: "string" },
                        desc: { type: "string" },
                      },
                      required: ["icon", "title", "desc"],
                      additionalProperties: false,
                    },
                  },
                  useCases: { type: "array", items: { type: "string" } },
                  inputFields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                        type: { type: "string" },
                        placeholder: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                      },
                      required: ["id", "label", "type", "placeholder", "options"],
                      additionalProperties: false,
                    },
                  },
                  outputType: { type: "string" },
                  steps: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                },
                required: [
                  "theme",
                  "icon",
                  "heroTitle",
                  "heroSubtitle",
                  "features",
                  "useCases",
                  "inputFields",
                  "outputType",
                  "steps",
                  "tags",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const content = res.choices?.[0]?.message?.content;
        const jsonStr = typeof content === "string"
          ? content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
          : null;

        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            // Preserve examplePrompts if it exists
            if (cfg.examplePrompts) {
              parsed.examplePrompts = cfg.examplePrompts;
            }
            await connection.query('UPDATE skills SET uiConfig = ? WHERE id = ?', [JSON.stringify(parsed), skill.id]);
            console.log(`  ✓ Fixed! Features: ${parsed.features?.length || 0}`);
          } catch (e: any) {
            console.log(`  ✗ Parse error: ${e.message}`);
          }
        } else {
          console.log(`  ✗ No content returned`);
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.log(`Skill ${skill.id}: ${skill.title} - OK (skipping)`);
      }
    } catch (err: any) {
      console.log(`Skill ${skill.id}: ERROR - ${err.message.slice(0, 100)}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await connection.end();
  console.log('\nDone!');
}

fixUiConfig();
