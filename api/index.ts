import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Loading...");

const app = express();
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log("[API] Incoming:", req.method, req.path, "url:", req.url);
  next();
});

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/test handler");
  res.status(200).json({ success: true, step: "express-ok" });
});

try {
  console.log("[API] Importing tRPC router...");
  const { appRouter } = require("../server/routers");
  console.log("[API] Creating tRPC middleware at /...");

  // Mount at root - tRPC will handle its own routing
  app.use(
    createExpressMiddleware({
      router: appRouter,
      createContext: async () => ({}),
      onError({ error, path }) {
        console.error(`[tRPC Error] ${path}:`, error?.message || error);
      },
      allowBatching: true,
    })
  );
  console.log("[API] tRPC middleware ready");
} catch (err) {
  console.error("[API] Failed to setup tRPC:", err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called:", req.url);
  app(req, res);
}
