import express from 'express';
import { body } from 'express-validator';
import isLoggedin from '../middlewares/isLoggedin.js';
import validateRequest from '../middlewares/validation.js';
import {
  startInterview,
  nextQuestion,
  submitAnswer,
  endInterview,
  getUserSessions
} from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', isLoggedin, [body('resumeText').optional().isString(), body('constraints').optional().isObject()], validateRequest, startInterview);
router.get('/sessions', isLoggedin, getUserSessions);
router.post('/question', isLoggedin, [body('sessionId').exists().isString()], validateRequest, nextQuestion);
router.post('/answer', isLoggedin, [body('sessionId').exists().isString(), body('questionId').exists().isString(), body('answer').exists()], validateRequest, submitAnswer);
router.post('/end', isLoggedin, [body('sessionId').exists().isString()], validateRequest, endInterview);

export default router;
