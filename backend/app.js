import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
import { authMiddleware } from "./src/middleware/auth.middleware.js";
import { pool } from "./src/db/pool.js";
import { uploadsDir } from "./src/middleware/upload.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
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
