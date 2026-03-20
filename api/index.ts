import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express, { Request, Response, NextFunction } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import path from "path";

console.log("[INIT] Starting api/index.ts");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: String(err) });
});

// Handle /api/trpc/* paths
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
}));

console.log("[INIT] Registered tRPC middleware");

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
console.log("[INIT] Static path:", distPath);
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

console.log("[INIT] Exporting handler");
export default serverless(app);
