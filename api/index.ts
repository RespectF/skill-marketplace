import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

// Log environment for debugging
console.log("[API] Starting...");
console.log("[API] NODE_ENV:", process.env.NODE_ENV);
console.log("[API] DATABASE_URL set:", !!process.env.DATABASE_URL);

const app = express();
app.use(express.json());

// Global error handler
app.use(
  (
    err: Error,
    _req: VercelRequest,
    res: VercelResponse,
    _next: express.NextFunction
  ) => {
    console.error("[API Error]:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
);

// tRPC endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
    allowBatching: true,
  })
);

// Test endpoint
app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/test called");
  res.status(200).json({ success: true, DATABASE_URL: !!process.env.DATABASE_URL });
});

// Vercel handler - use default export for ESM
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called for:", req.url);
  app(req, res);
}
