const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedin");
const {
  uploadUserData,
  getUserTrainingStatus,
  deleteUserFile,
  upload
} = require("../controllers/uploadController");

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

module.exports = router;