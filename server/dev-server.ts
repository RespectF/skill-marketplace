import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";
import { handleOAuthCallback } from "./_core/oauth.js";
import { handleSkillExecute } from "./skillExecute.js";
import net from "net";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // OAuth callback route
  app.get("/api/oauth/github/callback", async (req, res) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    const response = await handleOAuthCallback(
      new Request(fullUrl, { headers: req.headers } as Request)
    );
    // Convert Response to Express response
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "location") {
        res.setHeader("Location", value);
      } else if (key.toLowerCase() === "set-cookie") {
        res.setHeader("Set-Cookie", value);
      }
    });
    res.end();
  });

  // Skill execution SSE endpoint
  app.all("/api/skills/:id/execute", async (req, res) => {
    const skillId = req.params.id;
    const protocol = req.protocol;
    const host = req.get("host");
    const forwardUrl = `${protocol}://${host}/api/skills/${skillId}/execute`;

    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers[key] = Array.isArray(value) ? value.join(", ") : value;
    });

    const response = await handleSkillExecute(
      new Request(forwardUrl, {
        method: req.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(req.method)
          ? JSON.stringify(req.body)
          : undefined,
      })
    );

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      for await (const chunk of response.body) {
        res.write(chunk);
      }
    }
    res.end();
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const path = await import("path");
    const staticPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(staticPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `Vite dev server should be running on http://localhost:5173/`
      );
    }
  });
}

startServer().catch(console.error);
