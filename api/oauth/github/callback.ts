import { handleOAuthCallback } from "../../../server/_core/oauth.ts";

export const config = { runtime: "edge" };
export default handleOAuthCallback;