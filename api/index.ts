import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import path from "path";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rewrite /api/trpc/* to /trpc/* for tRPC handler
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/trpc")) {
    req.url = req.url.replace(/^\/api\/trpc/, "/trpc");
  }
  next();
});

registerOAuthRoutes(app);
registerSkillExecuteRoute(app);

// Mount tRPC at /trpc
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

export default serverless(app);
