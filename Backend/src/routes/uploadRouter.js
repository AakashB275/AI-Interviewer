import express from 'express';
import multer from 'multer';
import isLoggedin from '../middlewares/isLoggedin.js';
import {
  getUploadStatus,
  uploadTrainData
} from '../controllers/uploadController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/status', isLoggedin, getUploadStatus);

router.post(
  '/train-data',
  isLoggedin,
  upload.array('trainingFiles'),
  uploadTrainData
);

export default router;

