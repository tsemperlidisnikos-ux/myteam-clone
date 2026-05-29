import express from "express";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamDetails,
  addCoachToTeam,
  addAthleteToTeam,
  removeCoachFromTeam,
  removeAthleteFromTeam
} from "../controllers/teams.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// GET /teams/:clubId
router.get("/:clubId", getTeams);

// POST /teams/:clubId
router.post("/:clubId", adminOnly, createTeam);
router.put("/:clubId/:teamId", adminOnly, updateTeam);
router.delete("/:clubId/:teamId", adminOnly, deleteTeam);

// GET /teams/:clubId/:teamId
router.get("/:clubId/:teamId", getTeamDetails);

// POST /teams/:clubId/:teamId/coaches
router.post("/:clubId/:teamId/coaches", addCoachToTeam);

// POST /teams/:clubId/:teamId/athletes
router.post("/:clubId/:teamId/athletes", addAthleteToTeam);

// DELETE /teams/:clubId/:teamId/coaches/:userId
router.delete("/:clubId/:teamId/coaches/:userId", removeCoachFromTeam);

// DELETE /teams/:clubId/:teamId/athletes/:userId
router.delete("/:clubId/:teamId/athletes/:userId", removeAthleteFromTeam);

export default router;
