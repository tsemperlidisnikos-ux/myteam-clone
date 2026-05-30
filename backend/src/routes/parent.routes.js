import express from "express";
import {
  getMyChildren,
  getChildTrainings,
  getChildMatches,
  listParentLinks,
  linkParent,
} from "../controllers/parent.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { staffOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:clubId/children", clubAccessMiddleware, getMyChildren);
router.get("/:clubId/children/:athleteId/trainings", clubAccessMiddleware, getChildTrainings);
router.get("/:clubId/children/:athleteId/matches", clubAccessMiddleware, getChildMatches);
router.get("/:clubId/links", clubAccessMiddleware, staffOnly, listParentLinks);
router.post("/:clubId/children/:athleteId/link", clubAccessMiddleware, staffOnly, linkParent);

export default router;
