import express from "express";
import {
  getBillingStatus,
  createCheckoutSession,
} from "../controllers/billing.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/:clubId/status", clubAccessMiddleware, getBillingStatus);
router.post("/:clubId/checkout", clubAccessMiddleware, adminOnly, createCheckoutSession);

export default router;
