import express from "express";
import isLoggedin from "../middlewares/isLoggedin.js";
import {
  getUserStats,
  getPlatformStats
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/me", isLoggedin, getUserStats);
// Admin-only platform stats
const adminCheck = (req, res, next) => {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  const admins = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (admins.length === 0) {
    return res.status(403).json({ success: false, error: 'Admin not configured' });
  }
  const email = (req.user && req.user.email || '').toLowerCase();
  if (admins.includes(email)) return next();
  return res.status(403).json({ success: false, error: 'Forbidden' });
};

router.get("/platform", isLoggedin, adminCheck, getPlatformStats);

export default router;
