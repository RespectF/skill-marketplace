import type { VercelRequest, VercelResponse } from "@vercel/node";

let handler: any;
let handlerError: string | null = null;

try {
  const serverless = (await import("serverless-http")).default;
  const express = (await import("express")).default;
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
  const { registerOAuthRoutes } = await import("../server/_core/oauth");
  const { appRouter } = await import("../server/routers");
  const { createContext } = await import("../server/_core/context");
  const { registerSkillExecuteRoute } = await import("../server/skillExecute");
  const path = await import("path");

  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerSkillExecuteRoute(app);

  // Mount tRPC at /trpc (Vercel routes /api/* to api/index.ts, so /trpc becomes /api/trpc)
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const distPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  handler = serverless(app);
} catch (e: any) {
  console.error("[API Init Error]", e);
  handlerError = e.message;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  if (handlerError) {
    console.error("[API Handler Error]", handlerError);
    res.status(500).json({ error: "Server initialization failed", detail: handlerError });
    return;
  }
  return handler(req, res);
}
