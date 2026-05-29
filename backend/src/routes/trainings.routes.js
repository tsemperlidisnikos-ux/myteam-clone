import express from "express";
import {
  createTraining,
  getTrainings,
  getTrainingDetails,
  setAttendance,
  getAttendance,
  addExercise,
  getExercises
} from "../controllers/trainings.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { clubAccessMiddleware } from "../middleware/club.middleware.js";

const router = express.Router();

// Όλα τα routes είναι protected
router.use(authMiddleware);

// Έλεγχος ότι ο χρήστης ανήκει στο club
router.use("/:clubId", clubAccessMiddleware);

// GET /trainings/:clubId?team_id=...
router.get("/:clubId", getTrainings);

// POST /trainings/:clubId
router.post("/:clubId", createTraining);

// GET /trainings/:clubId/:trainingId
router.get("/:clubId/:trainingId", getTrainingDetails);

// POST /trainings/:clubId/:trainingId/attendance
router.post("/:clubId/:trainingId/attendance", setAttendance);

// GET /trainings/:clubId/:trainingId/attendance
router.get("/:clubId/:trainingId/attendance", getAttendance);

// POST /trainings/:clubId/:trainingId/exercises
router.post("/:clubId/:trainingId/exercises", addExercise);

// GET /trainings/:clubId/:trainingId/exercises
router.get("/:clubId/:trainingId/exercises", getExercises);

export default router;
