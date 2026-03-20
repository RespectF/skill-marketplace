export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate GitHub OAuth login URL
export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/oauth/github/callback`;
  // State is the URL to redirect back to after login (the original page)
  const state = btoa(window.location.origin);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);

  return url.toString();
};