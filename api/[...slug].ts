import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { Request, Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

console.log("[API] Starting...");

const app = express();
app.use(express.json());

app.get("/api/test", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

console.log("[API] Creating tRPC middleware...");
const middleware = createExpressMiddleware({
  router: appRouter,
  createContext,
  onError({ error, path }) {
    console.error(`[tRPC Error] ${path}:`, error?.message || error);
  },
  allowBatching: true,
});

console.log("[API] Mounting tRPC at /api/trpc...");
app.use("/api/trpc", middleware);
console.log("[API] Setup complete!");

app.use((req: Request, res: Response) => {
  console.log("[API] Unmatched path:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

const handler = (req: VercelRequest, res: VercelResponse) => {
  console.log("[API] Handler called for:", req.url);
  app(req, res);
};

export default handler;
