import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import axios from "axios";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

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

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/github/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: "application/json" },
          timeout: 10000,
        }
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        res.status(400).json({ error: "Failed to get access token" });
        return;
      }

      // Get user info
      const userResponse = await axios.get<GitHubUser>("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      });

      // Get primary email if not public
      let email = userResponse.data.email;
      if (!email) {
        const emailsResponse = await axios.get<GitHubEmail[]>(
          "https://api.github.com/user/emails",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
          }
        );
        const primaryEmail = emailsResponse.data.find((e) => e.primary && e.verified);
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

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to original page if state was provided
      let redirectUrl = "/";
      if (state) {
        try {
          redirectUrl = atob(state);
        } catch { /* use default */ }
      }
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}