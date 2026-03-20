import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json());

// Test endpoint
app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, message: "Test works!" });
});

// tRPC endpoint
app.use(
  "/api/trpc",
  (req, res, next) => {
    try {
      next();
    } catch (err) {
      console.error("[tRPC Error]", err);
      res.status(500).json({ error: String(err) });
    }
  },
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default serverless(app);
