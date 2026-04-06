import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import axios from "axios";
import * as db from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { sdk } from "./sdk.js";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function handleOAuthCallback(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("[OAuth] Callback received:", {
    code: code ? "present" : "missing",
    state: state ? "present" : "missing",
  });

  if (!code) {
    return Response.json({ error: "code is required" }, { status: 400 });
  }

  try {
    console.log("[OAuth] Requesting access token from GitHub...");
    const tokenResponse = await axios.post<GitHubTokenResponse>(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" }, timeout: 10000 }
    );

    console.log("[OAuth] Token response:", tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return Response.json(
        { error: "Failed to get access token" },
        { status: 400 }
      );
    }

    const userResponse = await axios.get<GitHubUser>(
      "https://api.github.com/user",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      }
    );

    console.log("[OAuth] User info:", {
      id: userResponse.data.id,
      login: userResponse.data.login,
    });

    let email = userResponse.data.email;
    if (!email) {
      const emailsResponse = await axios.get<GitHubEmail[]>(
        "https://api.github.com/user/emails",
        { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 }
      );
      const primaryEmail = emailsResponse.data.find(
        e => e.primary && e.verified
      );
      email = primaryEmail?.email ?? null;
    }

    const openId = `github:${userResponse.data.id}`;
    const userInfo = {
      openId,
      name: userResponse.data.name || userResponse.data.login,
      email,
      loginMethod: "github",
    };

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      appId: "local-dev",
      expiresInMs: ONE_YEAR_MS,
    });

    console.log("[OAuth] Session token created, setting cookie...");

    // 组装原生的 Set-Cookie 字符串
    const cookieOpts = getSessionCookieOptions(req);
    const cookieParts = [
      `${COOKIE_NAME}=${sessionToken}`,
      `Max-Age=${ONE_YEAR_MS / 1000}`,
      `Path=${cookieOpts.path}`,
      cookieOpts.httpOnly ? "HttpOnly" : "",
      `SameSite=${cookieOpts.sameSite}`,
      cookieOpts.secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    console.log("[OAuth] Cookie string:", cookieParts);

    let redirectUrl = "/";
    if (state) {
      try {
        redirectUrl = atob(state);
      } catch {
        /* use default */
      }
    }

    // 返回标准 Response，利用 Headers 执行 302 重定向并种下 Cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": cookieParts,
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed:", error);
    return Response.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}
