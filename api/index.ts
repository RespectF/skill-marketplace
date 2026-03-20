import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import path from "path";

// Create Express app for Vercel serverless
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback
registerOAuthRoutes(app);

// Skill execution SSE endpoint
registerSkillExecuteRoute(app);

// tRPC API
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files
const distPath = path.resolve(__dirname, "..", "public");
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Disable HTTP keep-alive to prevent connection issues
  res.setHeader("Connection", "close");
  app(req, res);
}
