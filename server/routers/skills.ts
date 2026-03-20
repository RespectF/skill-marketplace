import { TRPCError } from "@trpc/server";
import axios from "axios";
import { z } from "zod";
import { SKILL_CATEGORIES } from "../../drizzle/schema";
import {
  countSkillsBySlugPrefix,
  createSkill,
  deleteSkill,
  getSkillById,
  getSkillBySlug,
  getSkillList,
  incrementSkillView,
  updateSkill,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function makeUniqueSlug(base: string): Promise<string> {
  const count = await countSkillsBySlugPrefix(base);
  return count === 0 ? base : `${base}-${count + 1}`;
}

/** 从 SKILL.md 中解析 name/description */
function parseSkillMd(md: string): { name: string; description: string } {
  const nameMatch = md.match(/^name:\s*(.+)$/m);
  const descMatch = md.match(/^description:\s*([\s\S]+?)(?=\n\w|---|\n#|$)/m);
  return {
    name: nameMatch?.[1]?.trim() ?? "",
    description: descMatch?.[1]?.trim().replace(/\n/g, " ") ?? "",
  };
}

/** 通过 GitHub 获取 SKILL.md 内容（支持仓库根链接和子目录链接） */
async function fetchSkillMdFromGitHub(repoUrl: string): Promise<string> {
  // 支持格式:
  //   https://github.com/owner/repo
  //   https://github.com/owner/repo/tree/branch/path/to/skill
  //   https://github.com/owner/repo/blob/branch/path/SKILL.md
  const match = repoUrl.match(
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+)(?:\/(.+))?)?(?:\/)?$/
  );
  if (!match) throw new Error("无效的 GitHub 仓库链接");

  const [, owner, repo, branch, subPath = ""] = match;
  const cleanRepo = repo.replace(/\.git$/, "");

  // Helper: fetch raw content via raw.githubusercontent.com (most reliable)
  async function fetchRaw(filePath: string, ref: string): Promise<string | null> {
    const cleanPath = filePath.replace(/^\//, "");
    const url = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${ref}/${cleanPath}`;
    try {
      const res = await axios.get(url, { timeout: 10000, responseType: "text" });
      if (res.status === 200 && typeof res.data === "string" && res.data.length > 10) {
        return res.data;
      }
    } catch { /* ignore */ }
    return null;
  }

  // Helper: fetch via GitHub API (fallback, handles base64 content)
  async function fetchApi(filePath: string, ref: string): Promise<string | null> {
    const cleanPath = filePath.replace(/^\//, "");
    const url = `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${cleanPath}?ref=${ref}`;
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data?.content && res.data?.encoding === "base64") {
        return Buffer.from(res.data.content.replace(/\n/g, ""), "base64").toString("utf-8");
      }
      if (typeof res.data === "string" && res.data.length > 10) return res.data;
    } catch { /* ignore */ }
    return null;
  }

  // Helper: try a path with multiple branches
  async function tryPath(filePath: string): Promise<string | null> {
    const branches = branch ? [branch, "main", "master"] : ["main", "master"];
    const uniqueBranches = Array.from(new Set(branches));
    for (const b of uniqueBranches) {
      const raw = await fetchRaw(filePath, b);
      if (raw) return raw;
      const api = await fetchApi(filePath, b);
      if (api) return api;
    }
    return null;
  }

  // Build candidate paths in priority order
  const candidates: string[] = [];

  if (subPath) {
    // User linked to a specific subdirectory or file
    const cleanSub = subPath.replace(/\/$/, "");
    if (cleanSub.toLowerCase().endsWith(".md")) {
      // Direct link to a .md file
      candidates.push(cleanSub);
    } else {
      // Link to a directory — look for SKILL.md inside it
      candidates.push(`${cleanSub}/SKILL.md`);
    }
  }

  // Common locations
  candidates.push("SKILL.md");
  candidates.push("skills/SKILL.md");

  // If no subPath, also try to auto-discover by listing skills/ directory
  if (!subPath) {
    try {
      const ref = branch ?? "main";
      const listUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/contents/skills?ref=${ref}`;
      const listRes = await axios.get(listUrl, { timeout: 10000 });
      if (Array.isArray(listRes.data)) {
        // Add SKILL.md from each subdirectory
        for (const item of listRes.data) {
          if (item.type === "dir") {
            candidates.push(`skills/${item.name}/SKILL.md`);
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });

  for (const path of uniqueCandidates) {
    const content = await tryPath(path);
    if (content) return content;
  }

  throw new Error(
    "未能从该仓库获取 SKILL.md 文件，请确认仓库中存在 SKILL.md，或尝试直接粘贴具体 Skill 子目录的链接（如 https://github.com/owner/repo/tree/main/skills/my-skill）"
  );
}

/** 使用 LLM 为 Skill 生成个性化 UI 配置 */
async function generateUiConfig(skill: {
  title: string;
  description: string;
  skillMd: string;
}): Promise<string> {
  try {
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
${skill.skillMd.slice(0, 3000)}

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
    // Strip markdown code block formatting if present
    const jsonStr = typeof content === "string"
      ? content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      : null;
    // Validate it's proper JSON before returning
    if (jsonStr) {
      try {
        JSON.parse(jsonStr);
        return jsonStr;
      } catch { /* fall through to fallback */ }
    }
    return JSON.stringify({
      theme: "blue",
      icon: "🤖",
      heroTitle: skill.title,
      heroSubtitle: skill.description,
      features: [],
      useCases: [],
      inputFields: [],
      outputType: "text",
      steps: [],
      tags: [],
    });
  } catch (e) {
    console.error("[generateUiConfig] error:", e);
    return JSON.stringify({
      theme: "blue",
      icon: "🤖",
      heroTitle: skill.title,
      heroSubtitle: skill.description,
      features: [],
      useCases: [],
      inputFields: [],
      outputType: "text",
      steps: [],
      tags: [],
    });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const skillsRouter = router({
  /** 获取 Skill 列表（支持分页、搜索、分类筛选） */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().nullable().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        orderBy: z.enum(["latest", "popular"]).default("latest"),
        isOfficial: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        isEditorsPick: z.boolean().optional(),
        authorId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getSkillList(input);
    }),

  /** 获取单个 Skill（by ID） */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const skill = await getSkillById(input.id);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND", message: "Skill 不存在" });
      await incrementSkillView(input.id);
      return skill;
    }),

  /** 获取单个 Skill（by slug） */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const skill = await getSkillBySlug(input.slug);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND", message: "Skill 不存在" });
      await incrementSkillView(skill.id);
      return skill;
    }),

  /** 创建 Skill（手动填写） */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(128),
        description: z.string().min(1),
        category: z.enum([...SKILL_CATEGORIES] as [string, ...string[]]),
        skillMd: z.string().min(1),
        githubUrl: z.string().url().optional().or(z.literal("")),
        coverUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const baseSlug = slugify(input.title);
      const slug = await makeUniqueSlug(baseSlug);

      // 异步生成 UI 配置
      const uiConfig = await generateUiConfig({
        title: input.title,
        description: input.description,
        skillMd: input.skillMd,
      });

      await createSkill({
        slug,
        title: input.title,
        description: input.description,
        category: input.category as any,
        skillMd: input.skillMd,
        githubUrl: input.githubUrl || null,
        coverUrl: input.coverUrl || null,
        isOfficial: false,
        isFeatured: false,
        isEditorsPick: false,
        authorId: ctx.user.id,
        authorName: ctx.user.name ?? ctx.user.email ?? "匿名用户",
        uiConfig,
      });

      const created = await getSkillBySlug(slug);
      return created;
    }),

  /** 从 GitHub 仓库链接导入 Skill */
  importFromGitHub: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string().url(),
        title: z.string().min(1).max(128),
        description: z.string().min(1),
        category: z.enum([...SKILL_CATEGORIES] as [string, ...string[]]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const skillMd = await fetchSkillMdFromGitHub(input.githubUrl);

      const baseSlug = slugify(input.title);
      const slug = await makeUniqueSlug(baseSlug);

      const uiConfig = await generateUiConfig({
        title: input.title,
        description: input.description,
        skillMd,
      });

      await createSkill({
        slug,
        title: input.title,
        description: input.description,
        category: input.category as any,
        skillMd,
        githubUrl: input.githubUrl,
        isOfficial: false,
        authorId: ctx.user.id,
        authorName: ctx.user.name ?? ctx.user.email ?? "匿名用户",
        uiConfig,
      });

      const created = await getSkillBySlug(slug);
      return created;
    }),

  /** 解析 GitHub 仓库链接，返回 SKILL.md 内容和 LLM 推断分类 */
  parseGitHub: publicProcedure
    .input(z.object({ githubUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      const skillMd = await fetchSkillMdFromGitHub(input.githubUrl);
      const parsed = parseSkillMd(skillMd);

      // 用 LLM 自动推断分类
      let suggestedCategory = "";
      try {
        const catSystemPrompt = `你是一个分类助手。根据 Skill 的名称、描述和内容，从以下 5 个分类中选择最合适的一个：创意设计、开发技术、企业通信、文档处理、工具。只返回分类名称。`;
        const catUserPrompt = `Skill名称：${parsed.name || ""} 内容：${skillMd.slice(0, 800)}`;
        const catRes = await invokeLLM({
          messages: [
            { role: "system" as const, content: catSystemPrompt },
            { role: "user" as const, content: catUserPrompt },
          ],
        });
        const rawContent = catRes.choices?.[0]?.message?.content ?? "";
        const rawStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const validCats = ["创意设计", "开发技术", "企业通信", "文档处理", "工具"];
        const matched = validCats.find((c) => rawStr.includes(c));
        if (matched) suggestedCategory = matched;
      } catch { /* ignore, category stays empty */ }

      return { skillMd, ...parsed, suggestedCategory };
    }),

  /** 更新 Skill */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(128).optional(),
        description: z.string().min(1).optional(),
        category: z.enum([...SKILL_CATEGORIES] as [string, ...string[]]).optional(),
        skillMd: z.string().min(1).optional(),
        githubUrl: z.string().optional(),
        coverUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const skill = await getSkillById(input.id);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });
      if (skill.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "无权修改此 Skill" });
      }

      const { id, ...data } = input;
      let uiConfig = skill.uiConfig;

      // 仅 skillMd 变化时才重新生成 AI 界面；名称/描述/分类变更仅更新数据库
      if (data.skillMd) {
        uiConfig = await generateUiConfig({
          title: data.title ?? skill.title,
          description: data.description ?? skill.description,
          skillMd: data.skillMd,
        });
      }

      await updateSkill(id, { ...data, uiConfig, category: data.category as any });
      return getSkillById(id);
    }),

  /** 删除 Skill */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const skill = await getSkillById(input.id);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });
      if (skill.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "无权删除此 Skill" });
      }
      await deleteSkill(input.id);
      return { success: true };
    }),

  /** 获取所有分类 */
  categories: publicProcedure.query(() => {
    return SKILL_CATEGORIES;
  }),

  /**
   * 从 SKILL.md 中提取示例快捷提示词（用于详情页空状态）
   * 结果会被缓存在 uiConfig 中，首次调用后写入 DB
   */
  getExamplePrompts: publicProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });

      // Try to read from cached uiConfig first
      if (skill.uiConfig) {
        try {
          const cfg = JSON.parse(skill.uiConfig);
          if (Array.isArray(cfg.examplePrompts) && cfg.examplePrompts.length > 0) {
            return cfg.examplePrompts as string[];
          }
        } catch { /* ignore */ }
      }

      // Generate via LLM
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
${skill.skillMd.slice(0, 2000)}

请生成 3 条示例提示词，仅返回 JSON：`,
            },
          ],
        });

        const raw = res.choices?.[0]?.message?.content ?? "";
        const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);

        // Robustly extract JSON array from the response
        // The LLM may wrap JSON in markdown code blocks or add extra text
        let prompts: string[] = [];
        try {
          // Try 1: direct parse
          const direct = JSON.parse(rawStr);
          if (Array.isArray(direct)) {
            prompts = direct.filter((s): s is string => typeof s === "string");
          } else if (direct?.prompts && Array.isArray(direct.prompts)) {
            prompts = direct.prompts.filter((s: unknown): s is string => typeof s === "string");
          }
        } catch {
          // Try 2: extract JSON object/array from text using regex
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
          // Try 3: extract quoted strings as fallback
          if (prompts.length === 0) {
            const quoted = rawStr.match(/"一-龥a-zA-Z0-9，。！？、 ]{5,60}"/g);
            if (quoted) {
              prompts = quoted.slice(0, 3).map(s => s.replace(/^"|"$/g, ""));
            }
          }
        }

        // Sanitize: remove any strings containing XML/HTML tags or non-text content
        const safePrompts = prompts
          .filter(p => typeof p === "string" && p.length >= 4 && !/<[a-zA-Z]/.test(p))
          .slice(0, 3);

        // Cache into uiConfig (always write, even if uiConfig was null)
        if (safePrompts.length > 0) {
          try {
            let cfg: Record<string, unknown> = {};
            if (skill.uiConfig) {
              try { cfg = JSON.parse(skill.uiConfig); } catch { /* ignore */ }
            }
            cfg.examplePrompts = safePrompts;
            await updateSkill(skill.id, { uiConfig: JSON.stringify(cfg) });
          } catch { /* ignore cache write failure */ }
        }

        return safePrompts.length > 0 ? safePrompts : [
          `帮我处理一个任务`,
          `我想使用这个 Skill 提升效率`,
          `请帮我生成内容`,
        ];
      } catch (err) {
        console.error("[getExamplePrompts] LLM error:", err);
        // Fallback: generic prompts
        return [
          `帮我完成一个任务`,
          `我想使用这个 Skill 处理我的内容`,
          `请帮我分析和生成`,
        ];
      }
    }),

  /** 重新生成 UI 配置 */
  regenerateUiConfig: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const skill = await getSkillById(input.id);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });
      if (skill.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const uiConfig = await generateUiConfig({
        title: skill.title,
        description: skill.description,
        skillMd: skill.skillMd,
      });
      await updateSkill(input.id, { uiConfig });
      return { uiConfig };
    }),
});
