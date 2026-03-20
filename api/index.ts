import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

console.log("[API] Loading...");

let app: express.Express;

try {
  app = express();
  app.use(express.json());

  app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
    console.log("[API] /api/test called");
    res.status(200).json({ success: true, step: "express-basic" });
  });

  // Try importing tRPC components
  console.log("[API] Importing tRPC...");
} catch (err) {
  console.error("[API] Setup error:", err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called:", req.url);
  if (app) {
    app(req, res);
  } else {
    res.status(500).json({ error: "App not initialized" });
  }
}
