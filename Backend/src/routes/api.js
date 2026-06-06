import express from "express";

import indexRouter from "./index.js";
import usersRouter from "./usersRouter.js";
import contactRouter from "./contactRouter.js";
import uploadRouter from "./uploadRouter.js";
import interviewRouter from "./interviewRouter.js";
// import feedbackRouter from "./feedbackRouter.js";
import analyticsRouter from "./analyticsRouter.js";

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-interviewer-api' });
});

router.use('/', indexRouter);

router.use('/auth', usersRouter);

router.use('/contact', contactRouter);

router.use('/upload', uploadRouter);

router.use('/interview', interviewRouter);

// router.use('/feedback', feedbackRouter);

router.use('/analytics', analyticsRouter);

export default router;
