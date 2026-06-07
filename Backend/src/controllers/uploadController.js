import mongoose from 'mongoose';
import userModel from '../models/user.js';
import { DocumentModel } from '../models/document.js';
import { chunkModel } from '../models/chunks.js';
import { extractTextFromBuffer } from '../services/documentParser.js';
import { generateEmbedding } from '../services/embeddingService.js';

function chunkText(text, size = 800, overlap = 120) {
  if (!text || !text.trim()) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;
  while (start < words.length) {
    chunks.push(words.slice(start, start + size).join(' ').trim());
    start += size - overlap;
  }
  return chunks;
}

// POST /api/upload/train-data
export const uploadUserData = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const { dataType, description } = req.body;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.userTrainingData) {
      user.userTrainingData = {
        hasUploadedData: false,
        uploadedFiles:   [],
        lastUpdated:     null
      };
    }

    const documentResults = [];

    for (const file of req.files) {
      const { text } = await extractTextFromBuffer({
        buffer:       file.buffer,
        mimeType:     file.mimetype,
        originalName: file.originalname
      });

      if (!text || !text.trim()) {
        return res.status(422).json({
          success: false,
          error: `No readable text could be extracted from "${file.originalname}". Please upload a text-based PDF or DOCX.`
        });
      }

      //Upload the whole document to MongoDB
      const fileExt = file.originalname.includes('.')
        ? file.originalname.slice(file.originalname.lastIndexOf('.') + 1).toLowerCase()
        : 'unknown';

      const document = await DocumentModel.create({
        title:            file.originalname,
        content:          text,
        fileType:         fileExt,
        mimeType:         file.mimetype,
        originalFileName: file.originalname,
        metadata: {
          fileSize:   file.size,
          uploadedBy: userId
        }
      });

      const textChunks = chunkText(text);
      const chunkDocs  = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunkTextValue = textChunks[i];
        const embedding      = await generateEmbedding(chunkTextValue);
        chunkDocs.push({
          documentId:     document._id,
          ownerId:        userId,
          chunkText:      chunkTextValue,
          embedding,
          section:        'other',
          embeddingModel: process.env.EMBEDDING_PROVIDER || 'huggingface',
          embeddingDim:   embedding.length,
          position:       i,
          isActive:       true
        });
      }

      if (chunkDocs.length) {
        await chunkModel.insertMany(chunkDocs);
      }

      user.userTrainingData.uploadedFiles.push({
        originalName: file.originalname,
        filename:     document._id.toString(),
        size:         file.size,
        mimetype:     file.mimetype,
        uploadDate:   new Date(),
        isActive:     true
      });

      documentResults.push({
        documentId: document._id,
        chunkCount: chunkDocs.length,
        title:      document.title
      });
    }

    user.userTrainingData.hasUploadedData = true;
    user.userTrainingData.lastUpdated     = new Date();
    user.userTrainingData.dataType        = dataType || 'general';
    user.userTrainingData.description     = description || '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Files uploaded and processed successfully',
      uploadedFiles: req.files.map(f => ({
        originalName: f.originalname,
        size:         f.size,
        uploadDate:   new Date()
      })),
      totalFiles:       user.userTrainingData.uploadedFiles.filter(f => f.isActive !== false).length,
      documentsCreated: documentResults
    });

  } catch (err) {
    console.error('Error in file upload:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/upload/status
export const getUploadStatus = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Filter out soft-deleted files before sending to the client
    const activeFiles = (user.userTrainingData?.uploadedFiles || [])
      .filter(f => f.isActive !== false);

    const hasData  = activeFiles.length > 0;
    let documentId = null;

    if (hasData) {
      const latest = await DocumentModel.findOne({
        'metadata.uploadedBy': req.user._id,
        isActive: true
      }).sort({ createdAt: -1 });
      if (latest) documentId = latest._id.toString();
    }

    return res.status(200).json({
      success:         true,
      hasUploadedData: hasData,
      documentId,
      uploadedFiles:   activeFiles.map(f => ({
        originalName: f.originalName,
        filename:     f.filename,
        size:         f.size,
        mimetype:     f.mimetype,
        uploadDate:   f.uploadDate
      }))
    });

  } catch (err) {
    console.error('Error getting upload status:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/upload/training-status
export const getUserTrainingStatus = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const activeFiles = (user.userTrainingData?.uploadedFiles || [])
      .filter(f => f.isActive !== false);

    const hasData  = activeFiles.length > 0;
    let documentId = null;

    if (hasData) {
      const latest = await DocumentModel.findOne({
        'metadata.uploadedBy': req.user._id,
        isActive: true
      }).sort({ createdAt: -1 });
      if (latest) documentId = latest._id.toString();
    }

    return res.status(200).json({
      success:         true,
      hasUploadedData: hasData,
      fileCount:       activeFiles.length,
      lastUpdated:     hasData ? user.userTrainingData.lastUpdated : null,
      dataType:        hasData ? user.userTrainingData.dataType    : null,
      documentId,
      uploadedFiles:   activeFiles.map(f => ({
        originalName: f.originalName,
        filename:     f.filename,
        size:         f.size,
        mimetype:     f.mimetype,
        uploadDate:   f.uploadDate
      }))
    });

  } catch (err) {
    console.error('Error getting training status:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/upload/file/:filename
export const deleteUserFile = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { filename } = req.params;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user || !user.userTrainingData) {
      return res.status(404).json({ success: false, error: 'No training data found' });
    }

    // Confirm this file belongs to the requesting user
    const fileIndex = user.userTrainingData.uploadedFiles.findIndex(
      f => f.filename === filename
    );
    if (fileIndex === -1) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(filename)) {
      return res.status(400).json({ success: false, error: 'Invalid file ID' });
    }

    const documentObjectId = new mongoose.Types.ObjectId(filename);

    const updatedDoc = await DocumentModel.findOneAndUpdate(
      { _id: documentObjectId, 'metadata.uploadedBy': userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updatedDoc) {
      console.warn(`Document ${filename} not found or not owned by user ${userId}`);
    }

    await chunkModel.updateMany(
      { documentId: documentObjectId, ownerId: userId },
      { $set: { isActive: false } }
    );
    //This is where file is soft-deleted
    user.userTrainingData.uploadedFiles[fileIndex].isActive = false;

    // Recompute hasUploadedData from remaining active files only
    const activeFiles = user.userTrainingData.uploadedFiles.filter(
      f => f.isActive !== false
    );
    user.userTrainingData.hasUploadedData = activeFiles.length > 0;
    user.userTrainingData.lastUpdated     = new Date();
    await user.save();

    // Return the new latest active documentId so the frontend can update state
    let newLatestDocumentId = null;
    if (activeFiles.length > 0) {
      const latest = await DocumentModel.findOne({
        'metadata.uploadedBy': userId,
        isActive: true
      }).sort({ createdAt: -1 });
      if (latest) newLatestDocumentId = latest._id.toString();
    }

    return res.status(200).json({
      success:        true,
      message:        'File removed successfully',
      remainingFiles: activeFiles.length,
      documentId:     newLatestDocumentId
    });

  } catch (err) {
    console.error('Error removing file:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const uploadTrainData = uploadUserData;