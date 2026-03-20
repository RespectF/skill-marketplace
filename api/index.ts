import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express, { Request, Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import path from "path";

console.log("[INIT] api/index.ts loading...");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC middleware at /trpc
app.use("/trpc", (req: Request, _res: Response, next) => {
  console.log("[TRPC] path:", req.path, "url:", req.url);
  if (req.url.startsWith("/api/trpc")) {
    req.url = req.url.replace("/api/trpc", "/trpc");
  }
  next();
}, createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
console.log("[INIT] Static path:", distPath);
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({ error: String(err.stack) });
});

console.log("[INIT] Exporting serverless handler");
export default serverless(app);
