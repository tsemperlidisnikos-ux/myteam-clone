import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  sendMessage,
  getConversation,
  createNotification,
  getNotifications
} from "../controllers/communication.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// ANNOUNCEMENTS
router.post("/:clubId/announcements", clubAccessMiddleware, createAnnouncement);
router.get("/:clubId/announcements", clubAccessMiddleware, getAnnouncements);

// MESSAGES
router.post("/messages", sendMessage);
router.get("/messages/:userId", getConversation);

// NOTIFICATIONS
router.post("/notifications", createNotification);
router.get("/notifications/me", getNotifications);

export default router;
