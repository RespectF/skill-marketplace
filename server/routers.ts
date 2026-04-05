import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { skillsRouter } from "./routers/skills";
import { conversationsRouter } from "./routers/conversations";
import { interactionsRouter } from "./routers/interactions";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    // server/routers.ts 中的退出逻辑
    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieString = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;
        
        // 现在 ctx.resHeaders 是存在的，可以直接用来设置 Cookie
        ctx.resHeaders.append('Set-Cookie', cookieString);
        
        return { success: true } as const;
      }),
  }),
  skills: skillsRouter,
  conversations: conversationsRouter,
  interactions: interactionsRouter,
});

export type AppRouter = typeof appRouter;
