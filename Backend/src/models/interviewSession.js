import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },

  jobrole: { type: String, required: true },
  difficulty: { type: String, enum: ['easy','medium','hard'], required: true },

  status: { type: String, enum: ['pending','active','paused','ended'], default: 'pending' },

  currentQuestion: {
    text: String,
    competency: String,
    difficulty: String,
    askedAt: Date
  },

  questionHistory: [{
    text: String,
    competency: String,
    difficulty: String,
    evaluation: {
      depth: String,
      coverage: String,
      strengths: [String],
      gaps: [String],
      summary: String,
      followUpRecommended: Boolean
    }
  }],

  progress: {
    competenciesCovered: [String],
    strengths: [String],
    weaknesses: [String]
  },

  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

// Add indexes for common queries
interviewSessionSchema.index({ user: 1, status: 1 });
interviewSessionSchema.index({ documentId: 1 });
interviewSessionSchema.index({ createdAt: -1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
