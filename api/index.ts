import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Starting...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

try {
  console.log("[API] Importing appRouter...");
  const result = require("../server/routers");
  console.log("[API] require result keys:", Object.keys(result));
  console.log("[API] appRouter value:", result.appRouter);
  console.log("[API] appRouter type:", typeof result.appRouter);

  if (!result.appRouter) {
    console.error("[API] appRouter is undefined or null!");
    throw new Error("appRouter is " + String(result.appRouter));
  }

  console.log("[API] Creating tRPC middleware...");
  const middleware = createExpressMiddleware({
    router: result.appRouter,
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
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
