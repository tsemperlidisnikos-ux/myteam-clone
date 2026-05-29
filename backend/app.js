import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import clubsRoutes from "./src/routes/clubs.routes.js";
import teamsRoutes from "./src/routes/teams.routes.js";
import athletesRoutes from "./src/routes/athletes.routes.js";
import trainingsRoutes from "./src/routes/trainings.routes.js";
import matchesRoutes from "./src/routes/matches.routes.js";
import communicationRoutes from "./src/routes/communication.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";

// Middlewares
import { authMiddleware } from "./src/middleware/auth.middleware.js";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());

// Public route (health check)
app.get("/", (req, res) => {
  res.json({ message: "MyTeam API is running..." });
});

// Public routes
app.use("/auth", authRoutes);

// Protected routes (require JWT)
app.use("/clubs", authMiddleware, clubsRoutes);
app.use("/teams", authMiddleware, teamsRoutes);
app.use("/athletes", authMiddleware, athletesRoutes);
app.use("/trainings", authMiddleware, trainingsRoutes);
app.use("/matches", authMiddleware, matchesRoutes);
app.use("/communication", authMiddleware, communicationRoutes);
app.use("/analytics", authMiddleware, analyticsRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MyTeam API running on port ${PORT}`);
});
