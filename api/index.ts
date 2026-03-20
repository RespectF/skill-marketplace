import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import express from "express";
import path from "path";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);
registerSkillExecuteRoute(app);

// Mount tRPC at root - in Vercel, this api/index.ts handles /api/*
// so /api/trpc routes here with /trpc path
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
