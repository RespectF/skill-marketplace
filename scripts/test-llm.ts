import 'dotenv/config';
import { invokeLLM } from '../server/_core/llm.ts';

const skillMd = `---
name: docx
description: Professional Word document creation and editing tool
---

# Word Document Processor

Create and edit professional Word documents with ease.`;

async function test() {
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
          content: `Skill 名称：Word 文档处理
Skill 描述：Professional Word document creation and editing tool
SKILL.md 内容：
${skillMd}

请生成 3 条示例提示词，仅返回 JSON：`,
        },
      ],
    });

    console.log("Content:", res.choices?.[0]?.message?.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
