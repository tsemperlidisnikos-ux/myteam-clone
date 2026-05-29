import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  sendMessage,
  getConversation,
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/communication.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { staffOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:clubId/announcements", clubAccessMiddleware, staffOnly, createAnnouncement);
router.get("/:clubId/announcements", clubAccessMiddleware, getAnnouncements);

router.post("/messages", sendMessage);
router.get("/messages/:userId", getConversation);

router.post("/notifications", createNotification);
router.get("/notifications/me", getNotifications);
router.patch("/notifications/:notificationId/read", markNotificationRead);
router.patch("/notifications/me/read-all", markAllNotificationsRead);

export default router;
