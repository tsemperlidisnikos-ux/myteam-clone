import express from "express";
import {
  listAthletePayments,
  createAthletePayment,
  checkoutAthletePayment,
} from "../controllers/payments.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { adminOnly, staffOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:clubId", clubAccessMiddleware, listAthletePayments);
router.post("/:clubId", clubAccessMiddleware, adminOnly, createAthletePayment);
router.post("/:clubId/:paymentId/checkout", clubAccessMiddleware, checkoutAthletePayment);

export default router;
