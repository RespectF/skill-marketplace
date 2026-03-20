import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertConversation,
  InsertConversationMessage,
  InsertSkill,
  InsertUser,
  conversationMessages,
  conversations,
  skillFavorites,
  skillLikes,
  skills,
  userSkillApiKeys,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      _pool = mysql.createPool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || '3306'),
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Skills helpers ───────────────────────────────────────────────────────────

export async function getSkillList(opts: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  authorId?: number;
  isOfficial?: boolean;
  isFeatured?: boolean;
  isEditorsPick?: boolean;
  orderBy?: "latest" | "popular";
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (opts.category) conditions.push(eq(skills.category, opts.category as any));
  if (opts.authorId !== undefined) conditions.push(eq(skills.authorId, opts.authorId));
  if (opts.isOfficial !== undefined) conditions.push(eq(skills.isOfficial, opts.isOfficial));
  if (opts.isFeatured !== undefined) conditions.push(eq(skills.isFeatured, opts.isFeatured));
  if (opts.isEditorsPick !== undefined)
    conditions.push(eq(skills.isEditorsPick, opts.isEditorsPick));
  if (opts.search) {
    conditions.push(
      or(
        like(skills.title, `%${opts.search}%`),
        like(skills.description, `%${opts.search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderByClause =
    opts.orderBy === "popular"
      ? desc(skills.viewCount)
      : desc(skills.createdAt);

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(skills)
      .where(where)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getSkillById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getSkillBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function createSkill(data: InsertSkill) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(skills).values(data);
  return result;
}

export async function updateSkill(id: number, data: Partial<InsertSkill>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(skills).set(data).where(eq(skills.id, id));
}

export async function deleteSkill(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(skills).where(eq(skills.id, id));
}

export async function incrementSkillView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(skills)
    .set({ viewCount: sql`${skills.viewCount} + 1` })
    .where(eq(skills.id, id));
}

export async function countSkillsBySlugPrefix(prefix: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(skills)
    .where(like(skills.slug, `${prefix}%`));
  return Number(result[0]?.count ?? 0);
}

// ─── Conversation helpers ─────────────────────────────────────────────────────

/** 创建新会话 */
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(data);
  return result[0];
}

/** 更新会话元数据 */
export async function updateConversation(id: number, data: { title?: string; messageCount?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

/** 获取用户的会话列表（带 Skill 信息） */
export async function getUserConversations(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      messageCount: conversations.messageCount,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      skillId: conversations.skillId,
      skillTitle: skills.title,
      skillSlug: skills.slug,
      skillCategory: skills.category,
    })
    .from(conversations)
    .leftJoin(skills, eq(conversations.skillId, skills.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

/** 获取单个会话的消息列表 */
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(conversationMessages.createdAt);
}

/** 添加消息 */
export async function addConversationMessage(data: InsertConversationMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(conversationMessages).values(data);
}

/** 删除会话（连带消息） */
export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership
  const conv = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  if (!conv[0]) throw new Error("会话不存在或无权限删除");
  await db.delete(conversationMessages).where(eq(conversationMessages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ─── User Skill API Keys ──────────────────────────────────────────────────────

/** 获取用户为某个 Skill 配置的 API Key */
export async function getUserSkillApiKey(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userSkillApiKeys)
    .where(and(eq(userSkillApiKeys.userId, userId), eq(userSkillApiKeys.skillId, skillId)))
    .limit(1);
  return result[0] ?? null;
}

/** 保存（新增或更新）用户为某个 Skill 配置的 API Key */
export async function upsertUserSkillApiKey(userId: number, skillId: number, apiKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(userSkillApiKeys)
    .values({ userId, skillId, apiKey })
    .onDuplicateKeyUpdate({ set: { apiKey, updatedAt: new Date() } });
}

// ─── Skill Likes & Favorites ──────────────────────────────────────────────────

/** 检查用户是否已点赞某个 Skill */
export async function getUserSkillLike(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(skillLikes)
    .where(and(eq(skillLikes.userId, userId), eq(skillLikes.skillId, skillId)))
    .limit(1);
  return result[0] ?? null;
}

/** 点赞 Skill */
export async function likeSkill(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSkillLike(userId, skillId);
  if (existing) return false; // already liked
  await db.insert(skillLikes).values({ userId, skillId });
  await db.update(skills).set({ likeCount: sql`${skills.likeCount} + 1` }).where(eq(skills.id, skillId));
  return true;
}

/** 取消点赞 Skill */
export async function unlikeSkill(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSkillLike(userId, skillId);
  if (!existing) return false; // not liked
  await db.delete(skillLikes).where(and(eq(skillLikes.userId, userId), eq(skillLikes.skillId, skillId)));
  await db.update(skills).set({ likeCount: sql`${skills.likeCount} - 1` }).where(eq(skills.id, skillId));
  return true;
}

/** 检查用户是否已收藏某个 Skill */
export async function getUserSkillFavorite(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(skillFavorites)
    .where(and(eq(skillFavorites.userId, userId), eq(skillFavorites.skillId, skillId)))
    .limit(1);
  return result[0] ?? null;
}

/** 收藏 Skill */
export async function favoriteSkill(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSkillFavorite(userId, skillId);
  if (existing) return false;
  await db.insert(skillFavorites).values({ userId, skillId });
  await db.update(skills).set({ favoriteCount: sql`${skills.favoriteCount} + 1` }).where(eq(skills.id, skillId));
  return true;
}

/** 取消收藏 Skill */
export async function unfavoriteSkill(userId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSkillFavorite(userId, skillId);
  if (!existing) return false;
  await db.delete(skillFavorites).where(and(eq(skillFavorites.userId, userId), eq(skillFavorites.skillId, skillId)));
  await db.update(skills).set({ favoriteCount: sql`${skills.favoriteCount} - 1` }).where(eq(skills.id, skillId));
  return true;
}

/** 获取用户收藏的 Skill 列表 */
export async function getUserFavoriteSkills(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      description: skills.description,
      category: skills.category,
      coverUrl: skills.coverUrl,
      isOfficial: skills.isOfficial,
      authorName: skills.authorName,
      viewCount: skills.viewCount,
      likeCount: skills.likeCount,
      favoriteCount: skills.favoriteCount,
      uiConfig: skills.uiConfig,
      createdAt: skills.createdAt,
      favoritedAt: skillFavorites.createdAt,
    })
    .from(skillFavorites)
    .innerJoin(skills, eq(skillFavorites.skillId, skills.id))
    .where(eq(skillFavorites.userId, userId))
    .orderBy(desc(skillFavorites.createdAt));
}

/** 批量获取用户对多个 Skill 的点赞/收藏状态 */
export async function getUserSkillInteractions(userId: number, skillIds: number[]) {
  const db = await getDb();
  if (!db) return { likes: new Set<number>(), favorites: new Set<number>() };
  if (skillIds.length === 0) return { likes: new Set<number>(), favorites: new Set<number>() };

  const [likeRows, favRows] = await Promise.all([
    db.select({ skillId: skillLikes.skillId }).from(skillLikes)
      .where(and(eq(skillLikes.userId, userId), sql`${skillLikes.skillId} IN (${sql.join(skillIds.map(id => sql`${id}`), sql`, `)})`)),
    db.select({ skillId: skillFavorites.skillId }).from(skillFavorites)
      .where(and(eq(skillFavorites.userId, userId), sql`${skillFavorites.skillId} IN (${sql.join(skillIds.map(id => sql`${id}`), sql`, `)})`)),
  ]);

  return {
    likes: new Set(likeRows.map(r => r.skillId)),
    favorites: new Set(favRows.map(r => r.skillId)),
  };
}

// ─── User profile update ──────────────────────────────────────────────────────

/** 更新用户个人信息 */
export async function updateUserProfile(userId: number, data: { name?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}
