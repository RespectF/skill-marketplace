import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Loading...");

const t = initTRPC.create();
const router = t.router({
  greeting: t.procedure.query(() => "Hello from tRPC!"),
});

const app = express();
app.use(express.json());

app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ success: true, step: "test-ok" });
});

console.log("[API] Creating tRPC middleware with simple router...");
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: router,
    createContext: async () => ({}),
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  })
);
console.log("[API] tRPC middleware ready");

app.use((req, res) => {
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
