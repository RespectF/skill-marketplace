import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json());

// Global error handler
app.use((err: Error, _req: VercelRequest, res: VercelResponse, _next: any) => {
  console.error("[Global Error]", err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

// Test endpoint
app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, message: "Test works!" });
});

// tRPC endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  })
);

export default serverless(app);
