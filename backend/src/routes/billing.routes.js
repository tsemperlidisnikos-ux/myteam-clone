import express from "express";
import {
  getBillingStatus,
  createCheckoutSession,
  stripeWebhook,
} from "../controllers/billing.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

router.use(authMiddleware);
router.get("/:clubId/status", clubAccessMiddleware, getBillingStatus);
router.post("/:clubId/checkout", clubAccessMiddleware, adminOnly, createCheckoutSession);

export default router;
