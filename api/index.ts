import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Loading...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

try {
  console.log("[API] Importing tRPC router...");
  const { appRouter } = require("../server/routers");
  console.log("[API] appRouter imported successfully");
  console.log("[API] Creating tRPC middleware...");

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: async () => {
        console.log("[API] createContext called");
        return {};
      },
      onError({ error, path }) {
        console.error(`[tRPC Error] ${path}:`, error?.message || error);
      },
    })
  );
  console.log("[API] tRPC middleware ready");
} catch (err) {
  console.error("[API] Failed to setup tRPC:", err);
}

app.use((req, res) => {
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
