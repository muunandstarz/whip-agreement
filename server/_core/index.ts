import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { processWebhook } from "../chargeover";
import { sendReminderHandler } from "../reminderHandler";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { shortLinks } from "../../drizzle/schema";

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
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ── Short-link Redirect ────────────────────────────────────────────────────
  // GET /s/:slug → 302 to the stored targetUrl (increments click counter)
  app.get("/s/:slug", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).send("Service unavailable");
      const [link] = await db
        .select()
        .from(shortLinks)
        .where(eq(shortLinks.slug, req.params.slug))
        .limit(1);
      if (!link) return res.status(404).send("Link not found");
      if (link.expiresAt && link.expiresAt < new Date()) {
        return res.status(410).send("Link expired");
      }
      // Increment click counter (fire-and-forget)
      db.update(shortLinks)
        .set({ clicks: (link.clicks ?? 0) + 1 })
        .where(eq(shortLinks.id, link.id))
        .catch(() => {});
      return res.redirect(302, link.targetUrl);
    } catch (err) {
      console.error("[ShortLink] Redirect error:", err);
      return res.status(500).send("Internal error");
    }
  });

  // ── Scheduled Reminder Handler ─────────────────────────────────────────────
  // Called by Manus Heartbeat cron at 24h/48h/72h after agreement is sent.
  // The cron is created per-agreement in admin.agreements.send procedure.
  app.post("/api/scheduled/sendReminder", sendReminderHandler);

  // ── ChargeOver Webhook ──────────────────────────────────────────────────────
  // ChargeOver sends POST /api/webhooks/chargeover for invoice.created/updated/paid events.
  // Configure this URL in ChargeOver Settings → Webhooks.
  // Optionally add a shared secret header check here before going to production.
  app.post("/api/webhooks/chargeover", async (req, res) => {
    try {
      await processWebhook(req.body);
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[ChargeOver Webhook] Error:", err);
      // Return 500 so ChargeOver retries delivery
      res.status(500).json({ error: "Processing failed" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
