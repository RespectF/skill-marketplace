import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Loading...");

const app = express();
app.use(express.json());

// Log ALL requests with full details
app.use((req, res, next) => {
  console.log("[API] Request:", {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: { host: req.headers.host, origin: req.headers.origin }
  });
  next();
});

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/test handler called");
  res.status(200).json({ success: true, step: "test-ok" });
});

try {
  console.log("[API] Importing tRPC router...");
  const { appRouter } = require("../server/routers");
  console.log("[API] tRPC router imported, creating middleware...");

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: async () => ({}),
      onError({ error, path }) {
        console.error(`[tRPC Error] ${path}:`, error?.message || error);
      },
      allowBatching: true,
    })
  );
  console.log("[API] tRPC middleware ready at /api/trpc");
} catch (err) {
  console.error("[API] Failed to setup tRPC:", err);
}

// Fallback
app.use((req, res) => {
  console.log("[API] No route matched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Vercel handler called, url:", req.url);
  app(req, res);
}
