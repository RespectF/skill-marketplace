// Custom LLM endpoint (overrides Forge API when set)
const CUSTOM_LLM_API_URL = process.env.CUSTOM_LLM_API_URL ?? "http://120.24.86.32:3000/anthropic";
const CUSTOM_LLM_API_KEY = process.env.CUSTOM_LLM_API_KEY ?? "sk-cp-7919a1d83141f144e3c537562e774d596ac2e733fe0f39c5495fffb01390970d";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Custom LLM — used for Skill execution (Claude-compatible endpoint)
  customLlmApiUrl: CUSTOM_LLM_API_URL,
  customLlmApiKey: CUSTOM_LLM_API_KEY,
};
