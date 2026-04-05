import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, trpc-batch-mode",
      },
    });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc", // 确保跟你前端调用地址一致
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  });
}