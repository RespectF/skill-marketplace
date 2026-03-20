import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express, { Request, Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import path from "path";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC middleware at /trpc (Vercel will route /api/trpc to this)
app.use("/trpc", (req: Request, _res: Response, next) => {
  // Strip /api prefix if present
  const path = req.path;
  if (path.startsWith("/api/trpc")) {
    req.url = req.url.replace(/^\/api\/trpc/, "/trpc");
  }
  next();
}, createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

// SPA fallback
app.use("*", (_req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

export default serverless(app);
