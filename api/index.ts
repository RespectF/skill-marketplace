import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import path from "path";

function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerSkillExecuteRoute(app);

  // tRPC API at /api/trpc
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static files from dist/public
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  return app;
}

const handler = serverless(createApp());

export default function vercelHandler(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
