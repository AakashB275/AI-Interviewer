import express from "express";
import isLoggedin from "../middlewares/isLoggedin.js";
import {
  getUserStats,
  getPlatformStats
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/me", isLoggedin, getUserStats);
// maybe admin later
// router.get("/platform", getPlatformStats);

export default router;
