import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** 用户头像 URL */
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Skill 分类枚举
export const SKILL_CATEGORIES = [
  "创意设计",
  "开发技术",
  "企业通信",
  "文档处理",
  "工具",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

// Skills 主表
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  /** 唯一标识符（slug），如 algorithmic-art */
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  /** 展示名称 */
  title: varchar("title", { length: 128 }).notNull(),
  /** 简短描述（用于卡片展示） */
  description: text("description").notNull(),
  /** 分类 */
  category: mysqlEnum("category", [
    "创意设计",
    "开发技术",
    "企业通信",
    "文档处理",
    "工具",
  ])
    .default("工具")
    .notNull(),
  /** SKILL.md 完整内容 */
  skillMd: text("skillMd").notNull(),
  /** 封面图 URL（可选） */
  coverUrl: text("coverUrl"),
  /** GitHub 仓库链接（可选） */
  githubUrl: text("githubUrl"),
  /** 是否为官方 Skill */
  isOfficial: boolean("isOfficial").default(false).notNull(),
  /** 是否为编辑推荐 */
  isFeatured: boolean("isFeatured").default(false).notNull(),
  /** 是否为编辑精选 */
  isEditorsPick: boolean("isEditorsPick").default(false).notNull(),
  /** 使用/查看次数（热度） */
  viewCount: int("viewCount").default(0).notNull(),
  /** 点赞数 */
  likeCount: int("likeCount").default(0).notNull(),
  /** 收藏数 */
  favoriteCount: int("favoriteCount").default(0).notNull(),
  /** 作者 userId（外键，可为 null 表示官方） */
  authorId: int("authorId"),
  /** 作者展示名（冗余字段，方便展示） */
  authorName: varchar("authorName", { length: 128 }),
  /** LLM 生成的界面配置 JSON（用于详情页个性化渲染，含 examplePrompts 缓存） */
  uiConfig: text("uiConfig"),
  /** 是否需要 API Key（从 SKILL.md 解析得出） */
  requiresApiKey: boolean("requiresApiKey").default(false).notNull(),
  /** API Key 的名称/说明（如 "OpenAI API Key"） */
  apiKeyLabel: text("apiKeyLabel"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

// ─── User Skill API Keys ──────────────────────────────────────────────────────

/** 用户为特定 Skill 配置的 API Key（每用户独立） */
export const userSkillApiKeys = mysqlTable("user_skill_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  /** 加密存储的 API Key 值 */
  apiKey: text("apiKey").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSkillApiKey = typeof userSkillApiKeys.$inferSelect;

// ─── Skill Likes & Favorites ──────────────────────────────────────────────────

/** 用户点赞记录 */
export const skillLikes = mysqlTable("skill_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkillLike = typeof skillLikes.$inferSelect;

/** 用户收藏记录 */
export const skillFavorites = mysqlTable("skill_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkillFavorite = typeof skillFavorites.$inferSelect;

// ─── Conversation History ─────────────────────────────────────────────────────

/** 对话会话表：每次用户在某个 Skill 上开启的一轮对话 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** 归属用户 */
  userId: int("userId").notNull(),
  /** 归属 Skill */
  skillId: int("skillId").notNull(),
  /** 会话标题（取第一条用户消息的前 50 字） */
  title: varchar("title", { length: 256 }),
  /** 消息数量 */
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/** 对话消息表 */
export const conversationMessages = mysqlTable("conversation_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = typeof conversationMessages.$inferInsert;
