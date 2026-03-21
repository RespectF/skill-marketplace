import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Starting...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

// Direct test route at /api/trpc
app.get("/api/trpc", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/trpc direct route hit!");
  res.status(200).json({ success: true, at: "direct-route" });
});

try {
  console.log("[API] Importing appRouter...");
  const { appRouter } = require("../server/routers");
  console.log("[API] appRouter imported:", typeof appRouter);

  if (!appRouter) {
    throw new Error("appRouter is undefined");
  }

  console.log("[API] Creating tRPC middleware...");
  const middleware = createExpressMiddleware({
    router: appRouter,
    createContext: async () => ({}),
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  });

  console.log("[API] Mounting tRPC at /api/trpc...");
  app.use("/api/trpc", middleware);
  console.log("[API] Setup complete!");

} catch (err) {
  console.error("[API] ERROR:", err);
}

app.use((req, res) => {
  console.log("[API] Unmatched path:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called for:", req.url);
  app(req, res);
}
