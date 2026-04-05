import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: Request;              // 替换为标准的 Web Request
  resHeaders: Headers;       // 替换原有的 res，使用标准的 Headers 对象
  user: User | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions // 换成 fetch 适配器的类型
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 注意：我们将原生的 Web Request 传给 sdk
    // 如果 sdk.ts 里面也报错了，可能需要把 sdk.ts 里读取 header 的方式
    // 从 req.headers['xxx'] 改成 req.headers.get('xxx')
    user = await sdk.authenticateRequest(opts.req as any); 
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user,
  };
}