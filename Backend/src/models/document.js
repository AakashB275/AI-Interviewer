import mongoose from 'mongoose';

/**
 Document schema for storing uploaded documents and embeddings.
 @typedef {Object} IDocument
 @property {string} title
 @property {string} content
 @property {number[]} embedding
 @property {'pdf'|'doc'|'docx'|'txt'|'image'} filetype
 @property {string} originalFileName
 @property {{fileSize:number, uploadedBy:mongoose.Types.ObjectId, tags:string[], category:string, language:string}} metadata
 @property {boolean} isActive
 */

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Document content is required']
  },
  embedding: {
    type: [Number],
    required: [true, 'Embedding is required'],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Embedding must be a non-empty array of numbers'
    }
  },
  filetype: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'image'],
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  metadata: {
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String],
    category: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Define indexes
documentSchema.index({ 'metadata.uploadedBy': 1, isActive: 1 });
documentSchema.index({ 'metadata.tags': 1 });
documentSchema.index({ createdAt: -1 });

// Export the Document model
export const DocumentModel = mongoose.model('Document', documentSchema);
