import multer from 'multer';
import userModel from '../models/user.js';
import { DocumentModel } from '../models/document.js';
import { chunkModel } from '../models/chunks.js';
import { extractTextFromFile } from '../services/documentParser.js';
import { generateEmbedding } from '../services/embeddingService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

function chunkText(text, size = 800, overlap = 120) {
  if (!text || !text.trim()) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const chunkWords = words.slice(start, start + size);
    chunks.push(chunkWords.join(' ').trim());
    start += size - overlap;
  }

  return chunks;
}

export const uploadUserData = async function(req, res) {
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

    const documentResults = [];
    for (const file of uploadedFiles) {
      const { text, mimeType } = await extractTextFromFile({
        filePath: file.path,
        mimeType: file.mimetype,
        originalName: file.originalName
      });

      if (!text || !text.trim()) {
        throw new Error(`No readable text extracted from ${file.originalName}`);
      }

      const document = await DocumentModel.create({
        title: file.originalName,
        content: text,
        fileType: path.extname(file.originalName).replace('.', '').toLowerCase(),
        mimeType: mimeType || file.mimetype,
        originalFileName: file.originalName,
        metadata: {
          fileSize: file.size,
          uploadedBy: userId
        }
      });

      const textChunks = chunkText(text);
      const chunkDocs = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunkTextValue = textChunks[i];
        const embedding = await generateEmbedding(chunkTextValue);
        chunkDocs.push({
          documentId: document._id,
          ownerId: userId,
          chunkText: chunkTextValue,
          embedding,
          section: 'other',
          embeddingModel: 'text-embedding-3-small',
          embeddingDim: embedding.length,
          position: i
        });
      }

      if (chunkDocs.length) {
        await chunkModel.insertMany(chunkDocs);
      }

      documentResults.push({
        documentId: document._id,
        chunkCount: chunkDocs.length,
        title: document.title
      });
    }

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      uploadedFiles: uploadedFiles.map(file => ({
        originalName: file.originalName,
        size: file.size,
        uploadDate: file.uploadDate
      })),
      totalFiles: user.userTrainingData.uploadedFiles.length,
      documentsCreated: documentResults
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

export const getUserTrainingStatus = async function (req, res) {
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
    const fileCount = hasData ? user.userTrainingData.uploadedFiles.length : 0;

    // Get the most recent document for this user
    let documentId = null;
    if (hasData) {
      const latestDocument = await DocumentModel.findOne({
        'metadata.uploadedBy': req.user._id,
        isActive: true
      }).sort({ createdAt: -1 });
      
      if (latestDocument) {
        documentId = latestDocument._id.toString();
      }
    }

    // Get list of uploaded files with their details
    const uploadedFiles = hasData && user.userTrainingData.uploadedFiles 
      ? user.userTrainingData.uploadedFiles.map(file => ({
          originalName: file.originalName,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploadDate: file.uploadDate
        }))
      : [];

    return res.status(200).json({
      success: true,
      hasUploadedData: hasData,
      fileCount: fileCount,
      lastUpdated: hasData ? user.userTrainingData.lastUpdated : null,
      dataType: hasData ? user.userTrainingData.dataType : null,
      documentId: documentId,
      uploadedFiles: uploadedFiles
    });

  } catch (err) {
    console.error("Error getting training status:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const deleteUserFile = async function (req, res) {
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
    
    // Find and delete associated document and chunks
    // Find document by original filename
    const document = await DocumentModel.findOne({
      'metadata.uploadedBy': userId,
      originalFileName: fileToDelete.originalName,
      isActive: true
    });

    if (document) {
      // Delete all chunks associated with this document
      await chunkModel.deleteMany({ documentId: document._id });
      
      // Mark document as inactive (soft delete) or delete it
      document.isActive = false;
      await document.save();
    }
    
    // Delete physical file
    if (fs.existsSync(fileToDelete.path)) {
      fs.unlinkSync(fileToDelete.path);
    }

    // Remove from database
    user.userTrainingData.uploadedFiles.splice(fileIndex, 1);
    
    // Update hasUploadedData status
    if (user.userTrainingData.uploadedFiles.length === 0) {
      user.userTrainingData.hasUploadedData = false;
      user.userTrainingData.lastUpdated = null;
    } else {
      user.userTrainingData.lastUpdated = new Date();
    }
    
    await user.save();

    // Get the new latest document ID after deletion
    let newLatestDocumentId = null;
    if (user.userTrainingData.uploadedFiles.length > 0) {
      const latestDocument = await DocumentModel.findOne({
        'metadata.uploadedBy': userId,
        isActive: true
      }).sort({ createdAt: -1 });
      
      if (latestDocument) {
        newLatestDocumentId = latestDocument._id.toString();
      }
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      remainingFiles: user.userTrainingData.uploadedFiles.length,
      documentId: newLatestDocumentId
    });

  } catch (err) {
    console.error("Error deleting file:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

