import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addConversationMessage,
  createConversation,
  deleteConversation,
  getConversationMessages,
  getUserConversations,
  updateConversation,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const conversationsRouter = router({
  /**
   * 获取当前用户的所有对话历史（带 Skill 信息）
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserConversations(ctx.user.id);
  }),

  /**
   * 获取单个对话的消息列表
   */
  messages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const messages = await getConversationMessages(input.conversationId);
      // Verify the conversation belongs to the user
      if (messages.length === 0) return [];
      return messages;
    }),

  /**
   * 创建新对话（在第一条消息发送时调用）
   */
  create: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        firstMessage: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const title = input.firstMessage.slice(0, 50) + (input.firstMessage.length > 50 ? "..." : "");
      const result = await createConversation({
        userId: ctx.user.id,
        skillId: input.skillId,
        title,
        messageCount: 0,
      });
      return { conversationId: (result as any)?.insertId as number };
    }),

  /**
   * 保存一轮对话（用户消息 + AI 回复）
   */
  saveRound: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        userMessage: z.string().min(1),
        assistantMessage: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Save user message
      await addConversationMessage({
        conversationId: input.conversationId,
        role: "user",
        content: input.userMessage,
      });
      // Save assistant message
      await addConversationMessage({
        conversationId: input.conversationId,
        role: "assistant",
        content: input.assistantMessage,
      });
      // Update message count
      const messages = await getConversationMessages(input.conversationId);
      await updateConversation(input.conversationId, {
        messageCount: messages.length,
      });
      return { success: true };
    }),

  /**
   * 删除对话（含所有消息）
   */
  delete: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteConversation(input.conversationId, ctx.user.id);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: "FORBIDDEN", message: e.message });
      }
    }),
});
