import express from "express";
import {
  getClub,
  updateClub,
  getClubUsers,
  addUserToClub,
  changeUserRole
} from "../controllers/clubs.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";

const router = express.Router();

// Όλα τα routes εδώ είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// GET /clubs/:clubId
router.get("/:clubId", getClub);

// PUT /clubs/:clubId
router.put("/:clubId", updateClub);

// GET /clubs/:clubId/users
router.get("/:clubId/users", getClubUsers);

// POST /clubs/:clubId/users
router.post("/:clubId/users", addUserToClub);

// PUT /clubs/:clubId/users/:userId/role
router.put("/:clubId/users/:userId/role", changeUserRole);

export default router;
