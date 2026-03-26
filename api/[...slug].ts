import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, trpc-batch-mode");
    res.status(204).end();
    return;
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  });
}
