import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";

console.log("[INIT] Starting simple server...");

const app = express();
app.use(express.json());

// Test endpoint
app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[TEST] /api/test called");
  res.status(200).json({ success: true, message: "Test works!" });
});

console.log("[INIT] Exporting handler");
export default serverless(app);
