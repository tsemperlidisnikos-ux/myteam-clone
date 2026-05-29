import express from "express";
import {
  createMatch,
  getMatches,
  getMatchDetails,
  updateMatch,
  setMatchStats,
  getMatchStats,
  addMatchEvent,
  getMatchEvents
} from "../controllers/matches.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// GET /matches/:clubId?team_id=...
router.get("/:clubId", getMatches);

// POST /matches/:clubId
router.post("/:clubId", createMatch);

// PUT /matches/:clubId/:matchId
router.put("/:clubId/:matchId", updateMatch);

// GET /matches/:clubId/:matchId
router.get("/:clubId/:matchId", getMatchDetails);

// POST /matches/:clubId/:matchId/stats
router.post("/:clubId/:matchId/stats", setMatchStats);

// GET /matches/:clubId/:matchId/stats
router.get("/:clubId/:matchId/stats", getMatchStats);

// POST /matches/:clubId/:matchId/events
router.post("/:clubId/:matchId/events", addMatchEvent);

// GET /matches/:clubId/:matchId/events
router.get("/:clubId/:matchId/events", getMatchEvents);

export default router;
