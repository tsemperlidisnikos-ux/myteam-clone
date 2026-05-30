import express from "express";
import { registerClub, login, changePassword, forgotPassword, resetPassword, registerParent } from "../controllers/auth.controller.js";
import { acceptInvite } from "../controllers/invites.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

const authLimiter = rateLimit({ windowMs: 60000, max: 15, keyFn: (req) => req.ip + req.path });

const router = express.Router();

router.post("/register-club", authLimiter, registerClub);
router.post("/register-parent", authLimiter, registerParent);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/accept-invite", authLimiter, acceptInvite);
router.post("/change-password", authMiddleware, changePassword);

export default router;
