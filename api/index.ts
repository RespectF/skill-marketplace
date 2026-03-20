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
  console.log("[API] About to import appRouter...");
  const mod = require("../server/routers");
  console.log("[API] mod keys:", Object.keys(mod));
  const { appRouter } = mod;
  console.log("[API] appRouter type:", typeof appRouter);
  console.log("[API] appRouter keys:", appRouter ? Object.keys(appRouter) : "undefined");
} catch (err) {
  console.error("[API] Failed to import appRouter:", err);
}

app.use((req, res) => {
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
