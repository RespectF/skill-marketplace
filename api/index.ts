import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express, { Request, Response, NextFunction } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import path from "path";

const app = express();

// Debug middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log("[DEBUG] Request path:", req.path, "originalUrl:", req.originalUrl);
  next();
});

// Raw body parsing for tRPC
app.use(
  "/trpc",
  (req: Request, _res: Response, next: NextFunction) => {
    console.log("[DEBUG] /trpc middleware hit, path:", req.path);
    const originalUrl = req.originalUrl;
    if (originalUrl.startsWith("/api/trpc")) {
      console.log("[DEBUG] Rewriting path from", originalUrl, "to", originalUrl.replace(/^\/api\/trpc/, "/trpc"));
      req.originalUrl = originalUrl.replace(/^\/api\/trpc/, "/trpc");
      req.url = req.url.replace(/^\/api\/trpc/, "/trpc");
    }
    next();
  },
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// OAuth routes
registerOAuthRoutes(app);

// Skill execution route
registerSkillExecuteRoute(app);

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: err.message });
});

export default serverless(app);
