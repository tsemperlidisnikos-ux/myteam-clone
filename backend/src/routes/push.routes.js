import express from "express";
import { registerPushToken, getMyPushTokens } from "../controllers/push.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.post("/register", registerPushToken);
router.get("/me", getMyPushTokens);

export default router;
