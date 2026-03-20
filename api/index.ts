import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerSkillExecuteRoute } from "../server/skillExecute";
import path from "path";

// Error handler for unhandled errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection]", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
});

const app = express();

app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

try {
  registerOAuthRoutes(app);
  registerSkillExecuteRoute(app);
} catch (e) {
  console.error("[Route Registration Error]", e);
}

try {
  // Mount tRPC at /trpc (Vercel routes /api/* to api/index.ts, so /trpc becomes /api/trpc)
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
} catch (e) {
  console.error("[tRPC Middleware Error]", e);
}

const distPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

export default serverless(app);
