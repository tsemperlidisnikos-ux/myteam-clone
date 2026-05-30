import express from "express";
import {
  listGallery,
  createGalleryItem,
  deleteGalleryItem,
} from "../controllers/gallery.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";
import { staffOnly } from "../middleware/role.middleware.js";
import { uploadGallery } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:clubId", clubAccessMiddleware, listGallery);
router.post(
  "/:clubId",
  clubAccessMiddleware,
  staffOnly,
  uploadGallery.single("photo"),
  createGalleryItem
);
router.delete("/:clubId/:itemId", clubAccessMiddleware, staffOnly, deleteGalleryItem);

export default router;
