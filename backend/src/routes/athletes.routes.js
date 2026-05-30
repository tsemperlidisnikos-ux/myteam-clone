import express from "express";
import {
  getAthletes,
  createAthlete,
  getAthleteProfile,
  updateAthleteProfile,
  deleteAthlete,
  getAthleteTeams,
  getMyAthleteProfile,
  getMedicalOverview,
} from "../controllers/athletes.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly, staffOnly } from "../middleware/role.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// GET /athletes/:clubId
router.get("/:clubId", staffOnly, getAthletes);
router.get("/:clubId/me", getMyAthleteProfile);
router.get("/:clubId/medical", staffOnly, getMedicalOverview);

// POST /athletes/:clubId
router.post("/:clubId", adminOnly, createAthlete);

// GET /athletes/:clubId/:athleteId/teams
router.get("/:clubId/:athleteId/teams", getAthleteTeams);

// GET /athletes/:clubId/:athleteId
router.get("/:clubId/:athleteId", getAthleteProfile);

// PUT /athletes/:clubId/:athleteId
router.put("/:clubId/:athleteId", updateAthleteProfile);

// DELETE /athletes/:clubId/:athleteId
router.delete("/:clubId/:athleteId", adminOnly, deleteAthlete);

export default router;
