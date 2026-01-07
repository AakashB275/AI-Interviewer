import express from 'express';
import isLoggedIn from '../middlewares/isLoggedin.js';
import { uploadUserData, getUserTrainingStatus, deleteUserFile, upload } from '../controllers/uploadController.js';

const router = express.Router();

// Get user training status
router.get("/status", isLoggedIn, getUserTrainingStatus);

// Upload user training data
router.post("/train-data", isLoggedIn, uploadUserData);

// Delete specific file
router.delete("/file/:filename", isLoggedIn, deleteUserFile);

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Upload API is working!" });
});

export default router;