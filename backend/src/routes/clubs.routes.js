import express from "express";
import {
  getClub,
  updateClub,
  getClubUsers,
  createStaffUser,
  addUserToClub,
  changeUserRole,
  uploadClubLogo,
} from "../controllers/clubs.controller.js";

import { uploadLogo } from "../middleware/upload.middleware.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use("/:clubId", clubAccessMiddleware);

router.get("/:clubId", getClub);
router.put("/:clubId", adminOnly, updateClub);
router.post("/:clubId/logo", adminOnly, uploadLogo.single("logo"), uploadClubLogo);
router.get("/:clubId/users", getClubUsers);
router.post("/:clubId/staff", adminOnly, createStaffUser);
router.post("/:clubId/users", adminOnly, addUserToClub);
router.put("/:clubId/users/:userId/role", adminOnly, changeUserRole);

export default router;
