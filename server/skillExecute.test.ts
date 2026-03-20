import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerSkillExecuteRoute } from "./skillExecute";

// Mock db
vi.mock("./db", () => ({
  getSkillById: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock sdk
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    forgeApiUrl: "https://forge.manus.im",
    forgeApiKey: "test-key",
    appId: "test-app",
    cookieSecret: "test-secret",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    isProduction: false,
  },
}));

import { getSkillById } from "./db";
import { sdk } from "./_core/sdk";

function createTestApp() {
  const app = express();
  app.use(express.json());
  registerSkillExecuteRoute(app);
  return app;
}

describe("POST /skills/:id/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("Unauthorized"));

    const app = createTestApp();
    const res = await request(app)
      .post("/skills/1/execute")
      .send({ inputs: { task: "test" } });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 for invalid skill ID", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: "test",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const app = createTestApp();
    const res = await request(app)
      .post("/skills/abc/execute")
      .send({ inputs: { task: "test" } });

    expect(res.status).toBe(400);
  });

  it("returns 404 when skill not found", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: "test",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    vi.mocked(getSkillById).mockResolvedValue(null);

    const app = createTestApp();
    const res = await request(app)
      .post("/skills/999/execute")
      .send({ inputs: { task: "test" } });

    expect(res.status).toBe(404);
  });
});
