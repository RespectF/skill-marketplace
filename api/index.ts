import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

console.log("[API] Loading...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

// Direct route at /api/trpc (no tRPC)
app.get("/api/trpc", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/trpc GET called");
  res.status(200).json({ success: true, endpoint: "trpc-get" });
});

app.post("/api/trpc", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/trpc POST called");
  res.status(200).json({ success: true, endpoint: "trpc-post" });
});

// Catchall
app.use((req, res) => {
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
