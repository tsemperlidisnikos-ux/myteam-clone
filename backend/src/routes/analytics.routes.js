import express from "express";
import {
  getClubAnalytics,
  getTeamAnalytics,
  getAthleteAnalytics,
  getTrainingAnalytics,
  getMatchAnalytics,
  getClubCalendar,
  getUpcomingEvents
} from "../controllers/analytics.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// CLUB ANALYTICS
router.get("/:clubId/club", getClubAnalytics);

// CALENDAR
router.get("/:clubId/calendar", getClubCalendar);
router.get("/:clubId/upcoming", getUpcomingEvents);

// TEAM ANALYTICS
router.get("/:clubId/team/:teamId", getTeamAnalytics);

// ATHLETE ANALYTICS
router.get("/:clubId/athlete/:athleteId", getAthleteAnalytics);

// TRAINING ANALYTICS
router.get("/:clubId/team/:teamId/trainings", getTrainingAnalytics);

// MATCH ANALYTICS
router.get("/:clubId/team/:teamId/matches", getMatchAnalytics);

export default router;
