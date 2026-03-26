import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Request, type Response } from "express";
import serverless from "serverless-http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));

app.get("/api/test", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  })
);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

const serverlessHandler = serverless(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await serverlessHandler(req, res);
  } catch (err) {
    console.error("[Vercel Handler Error]", err);
    res.status(500).json({ error: "Internal server error", detail: String(err) });
  }
}
