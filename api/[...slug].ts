import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";

// 把原来的 default export 改成一个普通函数
async function handler(req: Request) {
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
    endpoint: "/api/trpc", 
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error?.message || error);
    },
  });
}

// Vercel 最新规范：导出具体的 HTTP 动词。
// 只要这样写，Vercel 就会在 Node.js 环境中自动为你注入标准的 Web Request 对象！
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;