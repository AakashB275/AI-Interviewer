import express from 'express';
import multer from 'multer';
import isLoggedin from '../middlewares/isLoggedin.js';
import {
  getUploadStatus,
  getUserTrainingStatus,
  uploadTrainData,
  deleteUserFile
} from '../controllers/uploadController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and JSON files are allowed.'));
    }
  }
});

router.post(
  '/train-data',
  isLoggedin,
  upload.array('trainingFiles'),
  uploadTrainData
);

router.get('/status', isLoggedin, getUploadStatus);

router.get('/training-status', isLoggedin, getUserTrainingStatus);

router.delete('/file/:filename', isLoggedin, deleteUserFile);

export default router;