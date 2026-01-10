import express from "express";

import indexRouter from "./index.js";
import usersRouter from "./usersRouter.js";
import contactRouter from "./contactRouter.js";
import uploadRouter from "./uploadRouter.js";
import interviewRouter from "./interviewRouter.js";
// import feedbackRouter from "./feedbackRouter.js";
import analyticsRouter from "./analyticsRouter.js";

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-interviewer-api' });
});

// Landing / public routes
router.use('/', indexRouter);

// Auth
router.use('/auth', usersRouter);

// Contact form
router.use('/contact', contactRouter);

// Resume upload
router.use('/upload', uploadRouter);

// Interview flows
router.use('/interview', interviewRouter);

// Feedback and reporting
// router.use('/feedback', feedbackRouter);

// Analytics
router.use('/analytics', analyticsRouter);

export default router;
