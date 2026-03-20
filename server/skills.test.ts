import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getSkillList: vi.fn().mockResolvedValue({
    items: [
      {
        id: 1,
        slug: "test-skill",
        title: "Test Skill",
        description: "A test skill",
        category: "工具",
        skillMd: "# Test",
        coverUrl: null,
        githubUrl: null,
        isOfficial: false,
        isFeatured: false,
        isEditorsPick: false,
        viewCount: 10,
        authorId: 1,
        authorName: "Test User",
        uiConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
  }),
  getSkillBySlug: vi.fn().mockResolvedValue({
    id: 1,
    slug: "test-skill",
    title: "Test Skill",
    description: "A test skill",
    category: "工具",
    skillMd: "# Test",
    coverUrl: null,
    githubUrl: null,
    isOfficial: false,
    isFeatured: false,
    isEditorsPick: false,
    viewCount: 10,
    authorId: 1,
    authorName: "Test User",
    uiConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getSkillById: vi.fn().mockResolvedValue({
    id: 1,
    slug: "test-skill",
    title: "Test Skill",
    description: "A test skill",
    category: "工具",
    skillMd: "# Test",
    coverUrl: null,
    githubUrl: null,
    isOfficial: false,
    isFeatured: false,
    isEditorsPick: false,
    viewCount: 10,
    authorId: 1,
    authorName: "Test User",
    uiConfig: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createSkill: vi.fn().mockResolvedValue({ insertId: 2 }),
  updateSkill: vi.fn().mockResolvedValue(undefined),
  deleteSkill: vi.fn().mockResolvedValue(undefined),
  incrementSkillView: vi.fn().mockResolvedValue(undefined),
  countSkillsBySlugPrefix: vi.fn().mockResolvedValue(0),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            theme: "blue",
            icon: "🤖",
            heroTitle: "Test Skill",
            heroSubtitle: "A test skill",
            features: [],
            useCases: [],
            inputFields: [],
            outputType: "text",
            steps: [],
            tags: [],
          }),
        },
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("skills.list", () => {
  it("returns skill list with pagination", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.list({ limit: 10, offset: 0, orderBy: "latest" });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("accepts category filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.list({ category: "工具", limit: 10, offset: 0, orderBy: "latest" });
    expect(result).toHaveProperty("items");
  });

  it("accepts search filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.list({ search: "test", limit: 10, offset: 0, orderBy: "popular" });
    expect(result).toHaveProperty("items");
  });
});

describe("skills.getBySlug", () => {
  it("returns skill by slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.getBySlug({ slug: "test-skill" });
    expect(result.slug).toBe("test-skill");
    expect(result.title).toBe("Test Skill");
  });
});

describe("skills.categories", () => {
  it("returns all categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.categories();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain("创意设计");
    expect(result).toContain("开发技术");
    expect(result).toContain("企业通信");
    expect(result).toContain("文档处理");
    expect(result).toContain("工具");
  });
});

describe("skills.create", () => {
  it("creates a skill when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.create({
      title: "New Skill",
      description: "A new skill description",
      category: "工具",
      skillMd: "# New Skill\n\nThis is a new skill.",
    });
    expect(result).toBeTruthy();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.skills.create({
        title: "New Skill",
        description: "A new skill description",
        category: "工具",
        skillMd: "# New Skill",
      })
    ).rejects.toThrow();
  });
});

describe("skills.delete", () => {
  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.skills.delete({ id: 1 })).rejects.toThrow();
  });

  it("allows owner to delete their skill", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.skills.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});
