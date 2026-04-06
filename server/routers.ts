import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { skillsRouter } from "./routers/skills.js";
import { conversationsRouter } from "./routers/conversations.js";
import { interactionsRouter } from "./routers/interactions.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    // server/routers.ts 中的退出逻辑
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const cookieString = `${COOKIE_NAME}=; Path=${cookieOptions.path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=${cookieOptions.sameSite}; Secure=${cookieOptions.secure}`;
      ctx.resHeaders.set("Set-Cookie", cookieString);
      return { success: true } as const;
    }),
  }),
  skills: skillsRouter,
  conversations: conversationsRouter,
  interactions: interactionsRouter,
});

export type AppRouter = typeof appRouter;
