import express from 'express';
import { body } from 'express-validator';
import isLoggedin from '../middlewares/isLoggedin.js';
import validateRequest from '../middlewares/validation.js';

import {
  startInterview,
  submitAnswer,
  endInterview,
  getUserSessions
} from '../controllers/interviewController.js';

const router = express.Router();

router.post(
  '/start',
  isLoggedin,
  [
    body('documentId').exists().isString(),
    body('role').exists().isString()
    // difficulty is now determined automatically by the backend
  ],
  validateRequest,
  startInterview
);

router.post(
  '/answer',
  isLoggedin,
  [
    body('sessionId').exists().isString(),
    body('answer').exists().isString()
  ],
  validateRequest,
  submitAnswer
);

router.post(
  '/end',
  isLoggedin,
  [body('sessionId').exists().isString()],
  validateRequest,
  endInterview
);

router.get(
  '/sessions',
  isLoggedin,
  getUserSessions
);

export default router;
