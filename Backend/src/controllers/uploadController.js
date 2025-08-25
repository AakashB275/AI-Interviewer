const multer = require("multer");
const express = require("express");
const userModel = require("../models/userModel");
const fs = require("fs")

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/user-data');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and JSON files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit
  },
  fileFilter: fileFilter
});

module.exports.uploadUserData = async function(req, res, cb) {
    try{
        if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded"
      });
    }
    const { dataType, description } = req.body;
    const userId = req.user._id;

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date()
    }));

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Initialize userTrainingData if it doesn't exist
    if (!user.userTrainingData) {
      user.userTrainingData = {
        hasUploadedData: false,
        uploadedFiles: [],
        lastUpdated: null
      };
    }

    // Add new files to user's training data
    user.userTrainingData.uploadedFiles.push(...uploadedFiles);
    user.userTrainingData.hasUploadedData = true;
    user.userTrainingData.lastUpdated = new Date();
    user.userTrainingData.dataType = dataType || 'general';
    user.userTrainingData.description = description || '';

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      uploadedFiles: uploadedFiles.map(file => ({
        originalName: file.originalName,
        size: file.size,
        uploadDate: file.uploadDate
      })),
      totalFiles: user.userTrainingData.uploadedFiles.length
    });

    }
    catch(err){
        console.error("Error in file upload:", err.message);
    
    // Clean up uploaded files if database operation failed
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports.getUserTrainingStatus = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const hasData = user.userTrainingData && user.userTrainingData.hasUploadedData;
    const fileCount = 1;

    return res.status(200).json({
      success: true,
      hasUploadedData: hasData,
      fileCount: fileCount,
      lastUpdated: hasData ? user.userTrainingData.lastUpdated : null,
      dataType: hasData ? user.userTrainingData.dataType : null
    });

  } catch (err) {
    console.error("Error getting training status:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports.deleteUserFile = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { filename } = req.params;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user || !user.userTrainingData) {
      return res.status(404).json({
        success: false,
        error: "No training data found"
      });
    }

    // Find and remove file from database
    const fileIndex = user.userTrainingData.uploadedFiles.findIndex(
      file => file.filename === filename
    );

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "File not found"
      });
    }

    const fileToDelete = user.userTrainingData.uploadedFiles[fileIndex];
    
    // Delete physical file
    if (fs.existsSync(fileToDelete.path)) {
      fs.unlinkSync(fileToDelete.path);
    }

    // Remove from database
    user.userTrainingData.uploadedFiles.splice(fileIndex, 1);
    
    // Update hasUploadedData status
    if (user.userTrainingData.uploadedFiles.length === 0) {
      user.userTrainingData.hasUploadedData = false;
    }
    
    user.userTrainingData.lastUpdated = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      remainingFiles: user.userTrainingData.uploadedFiles.length
    });

  } catch (err) {
    console.error("Error deleting file:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports.upload = upload;

