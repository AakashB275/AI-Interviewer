import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function () {
      // Password required only for local auth users
      return this.authProvider === 'local';
    },
    minlength: 6,
    select: false // never include password in queries by default
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  contact: {
    type: String,
    required: function () {
      // Contact optional for OAuth users
      return this.authProvider === 'local';
    }
  },
  userTrainingData: {
    hasUploadedData: {
      type: Boolean,
      default: false
    },
    uploadedFiles: [
      {
        originalName: String,
        filename:   String,
        size:       Number,
        mimetype:   String,
        uploadDate: {
          type: Date,
          default: Date.now
        },
        isActive: {
          type:    Boolean,
          default: true
        }
      }
    ],
    dataType: {
      type: String,
      enum: ['resume', 'job-description', 'interview-questions', 'general'],
      default: 'general'
    },
    description: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    googleId: {
      type:   String,
      sparse: true
    },
    avatar: {
      type:    String,
      default: null
    }
  }
});

export default mongoose.model('user', userSchema);