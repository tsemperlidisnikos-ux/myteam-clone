import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { pool } from "./src/db/pool.js";

dotenv.config();

import authRoutes from "./src/routes/auth.routes.js";
import clubsRoutes from "./src/routes/clubs.routes.js";
import teamsRoutes from "./src/routes/teams.routes.js";
import athletesRoutes from "./src/routes/athletes.routes.js";
import trainingsRoutes from "./src/routes/trainings.routes.js";
import matchesRoutes from "./src/routes/matches.routes.js";
import communicationRoutes from "./src/routes/communication.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import billingRoutes from "./src/routes/billing.routes.js";
import pushRoutes from "./src/routes/push.routes.js";
import parentRoutes from "./src/routes/parent.routes.js";
import { authMiddleware } from "./src/middleware/auth.middleware.js";
import { uploadsDir } from "./src/middleware/upload.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const corsOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin ? [corsOrigin, "http://localhost:5173"] : true,
    credentials: true,
  })
);

app.post(
  "/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !secret) {
      return res.status(501).json({ error: "Webhook not configured" });
    }
    const stripe = new Stripe(stripeKey);
    const sig = req.headers["stripe-signature"];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, secret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const clubId = session.metadata?.club_id;
        if (clubId) {
          await pool.query(
            `UPDATE clubs SET subscription_status = 'active', plan_tier = 'pro' WHERE id = $1`,
            [clubId]
          );
        }
      }
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.json({ message: "MyTeam API is running..." });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.use("/auth", authRoutes);
app.use("/billing", billingRoutes);
app.use("/push", pushRoutes);
app.use("/parents", parentRoutes);
app.use("/clubs", authMiddleware, clubsRoutes);
app.use("/teams", authMiddleware, teamsRoutes);
app.use("/athletes", authMiddleware, athletesRoutes);
app.use("/trainings", authMiddleware, trainingsRoutes);
app.use("/matches", authMiddleware, matchesRoutes);
app.use("/communication", authMiddleware, communicationRoutes);
app.use("/analytics", authMiddleware, analyticsRoutes);

export default app;

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MyTeam API running on port ${PORT}`);
  });
}
