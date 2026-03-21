import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

console.log("[API] Step 1: Starting...");

let app: express.Express;

try {
  console.log("[API] Step 2: Creating express app...");
  app = express();
  app.use(express.json());

  console.log("[API] Step 3: Adding /api/test route...");
  app.get("/api/test", (_req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({ success: true, step: "test-ok" });
  });

  console.log("[API] Step 4: Importing appRouter...");
  const { appRouter } = require("../server/routers");
  console.log("[API] Step 5: appRouter imported:", typeof appRouter);

  if (!appRouter) {
    console.error("[API] ERROR: appRouter is undefined!");
    throw new Error("appRouter is undefined");
  }

  console.log("[API] Step 6: Creating tRPC middleware...");
  const middleware = createExpressMiddleware({
    router: appRouter,
    createContext: async () => {
      console.log("[API] createContext called");
      return {};
    },
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  });

  console.log("[API] Step 7: Mounting tRPC at /api/trpc...");
  app.use("/api/trpc", middleware);

  console.log("[API] Step 8: Setup complete!");
} catch (err) {
  console.error("[API] ERROR during setup:", err);
  // Create a minimal app for error reporting
  app = express();
  app.use(express.json());
  app.get("/api/test", (_req, res) => {
    res.status(200).json({ success: true, error: "setup-failed" });
  });
}

app.use((req, res) => {
  console.log("[API] Unmatched:", req.path);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called for:", req.url);
  app(req, res);
}
