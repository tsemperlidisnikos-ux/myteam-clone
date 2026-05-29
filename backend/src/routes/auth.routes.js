import express from "express";
import { registerClub, login, changePassword } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register-club", registerClub);
router.post("/login", login);
router.post("/change-password", authMiddleware, changePassword);

export default router;
