import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  favoriteSkill,
  getSkillById,
  getUserFavoriteSkills,
  getUserSkillApiKey,
  getUserSkillFavorite,
  getUserSkillInteractions,
  getUserSkillLike,
  likeSkill,
  unfavoriteSkill,
  unlikeSkill,
  updateUserProfile,
  upsertUserSkillApiKey,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const interactionsRouter = router({
  // ─── Like / Unlike ──────────────────────────────────────────────────────────

  /** 切换点赞状态 */
  toggleLike: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND", message: "Skill 不存在" });

      const existing = await getUserSkillLike(ctx.user.id, input.skillId);
      if (existing) {
        await unlikeSkill(ctx.user.id, input.skillId);
        return { liked: false };
      } else {
        await likeSkill(ctx.user.id, input.skillId);
        return { liked: true };
      }
    }),

  /** 切换收藏状态 */
  toggleFavorite: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND", message: "Skill 不存在" });

      const existing = await getUserSkillFavorite(ctx.user.id, input.skillId);
      if (existing) {
        await unfavoriteSkill(ctx.user.id, input.skillId);
        return { favorited: false };
      } else {
        await favoriteSkill(ctx.user.id, input.skillId);
        return { favorited: true };
      }
    }),

  /** 获取当前用户对一批 Skill 的点赞/收藏状态 */
  getInteractions: protectedProcedure
    .input(z.object({ skillIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      const { likes, favorites } = await getUserSkillInteractions(ctx.user.id, input.skillIds);
      return {
        likes: Array.from(likes),
        favorites: Array.from(favorites),
      };
    }),

  /** 获取用户收藏的 Skill 列表 */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    return getUserFavoriteSkills(ctx.user.id);
  }),

  // ─── API Key 配置 ────────────────────────────────────────────────────────────

  /** 获取用户为某个 Skill 配置的 API Key（脱敏返回） */
  getApiKey: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ ctx, input }) => {
      const record = await getUserSkillApiKey(ctx.user.id, input.skillId);
      if (!record) return { configured: false, maskedKey: null };
      // 脱敏：只返回前 8 位 + ****
      const key = record.apiKey;
      const masked = key.length > 8 ? key.slice(0, 8) + "****" : "****";
      return { configured: true, maskedKey: masked };
    }),

  /** 获取用户为某个 Skill 配置的 API Key（完整值，用于执行时传入） */
  getApiKeyRaw: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ ctx, input }) => {
      const record = await getUserSkillApiKey(ctx.user.id, input.skillId);
      return record?.apiKey ?? null;
    }),

  /** 保存 API Key 配置 */
  saveApiKey: protectedProcedure
    .input(z.object({ skillId: z.number(), apiKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) throw new TRPCError({ code: "NOT_FOUND", message: "Skill 不存在" });
      await upsertUserSkillApiKey(ctx.user.id, input.skillId, input.apiKey);
      return { success: true };
    }),

  // ─── User Profile ────────────────────────────────────────────────────────────

  /** 更新用户个人信息（名称、头像） */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: { name?: string; avatarUrl?: string } = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || undefined;
      await updateUserProfile(ctx.user.id, data);
      return { success: true };
    }),
});
