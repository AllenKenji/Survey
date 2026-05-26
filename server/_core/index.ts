import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ensureDefaultLocalAdmin, hashPassword, normalizeUsername } from "./localAuth";
import { ENV } from "./env";
import * as db from "../db";

const normalizeBasePath = (value: string | undefined) => {
  const raw = (value || "/survey").trim();
  if (!raw || raw === "/") return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
};

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
  await ensureDefaultLocalAdmin();
  const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH);

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post(`${appBasePath}/api/internal/bis/provision-user`, async (req, res) => {
    try {
      const providedKey = String(req.header("x-bis-provision-key") || "").trim();
      const expectedKey = String(ENV.bisProvisionApiKey || "").trim();

      if (!expectedKey || providedKey !== expectedKey) {
        res.status(403).json({ detail: "Forbidden" });
        return;
      }

      if (!ENV.localAuthEnabled) {
        res.status(409).json({ detail: "Local auth is disabled" });
        return;
      }

      const hasSchema = await db.hasLocalAuthSchema();
      if (!hasSchema) {
        res.status(409).json({ detail: "Local auth schema is missing" });
        return;
      }

      const payload = req.body ?? {};
      const externalId = String(payload.externalId || "").trim();
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");
      const role = String(payload.role || "").trim().toLowerCase();

      if (!externalId || !name || !email || !password) {
        res.status(400).json({ detail: "externalId, name, email, and password are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ detail: "Password must be at least 6 characters" });
        return;
      }

      if (!["surveyor", "supervisor"].includes(role)) {
        res.status(400).json({ detail: "Only surveyor or supervisor roles are allowed" });
        return;
      }

      const openId = `bis:${externalId}`;
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "local-password",
        role: role as "surveyor" | "supervisor",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ detail: "Failed to create or fetch provisioned user" });
        return;
      }

      const usernameCandidate = normalizeUsername(email);
      const existingUsername = await db.getLocalCredentialByUsername(usernameCandidate);
      if (existingUsername && existingUsername.userId !== user.id) {
        res.status(409).json({ detail: "Username already exists in CFDP" });
        return;
      }

      const { salt, hash } = hashPassword(password);
      await db.upsertLocalCredential({
        userId: user.id,
        username: usernameCandidate,
        passwordHash: hash,
        salt,
        isActive: true,
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          openId,
          role,
          username: usernameCandidate,
          email,
        },
      });
    } catch (err) {
      console.error("[BIS Provision] Failed to provision CFDP user", err);
      res.status(500).json({ detail: "Failed to provision CFDP user" });
    }
  });

  // OAuth callback under /survey/api/oauth/callback
  registerOAuthRoutes(app, `${appBasePath}/api`);
  // tRPC API under /survey/api/trpc
  app.use(
    `${appBasePath}/api/trpc`,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, appBasePath);
  } else {
    serveStatic(app, appBasePath);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
