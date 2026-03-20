import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

console.log("[API] Loading...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  console.log("[API] /api/test called");
  res.status(200).json({ success: true, step: "express-ok" });
});

let tRPCLoaded = false;
let router: any = null;

try {
  console.log("[API] Importing tRPC router...");
  const { appRouter } = require("../server/routers");
  console.log("[API] tRPC router imported");
  router = appRouter;
  tRPCLoaded = true;
} catch (err) {
  console.error("[API] Failed to import tRPC router:", err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called:", req.url, "tRPC:", tRPCLoaded);
  app(req, res);
}
