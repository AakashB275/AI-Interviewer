import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },

  // Preferred field name used across controllers/services
  role: { type: String, required: true },
  // Back-compat: older field name (avoid breaking existing data)
  jobrole: { type: String },
  difficulty: { type: String, enum: ['easy','medium','hard'], required: true },

  status: { type: String, enum: ['pending','active','paused','ended'], default: 'pending' },

  interviewPlan: {
    type: Object,
    required: true
  },

  currentQuestionIndex: { type: Number, default: 0 },

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
  
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

// Enforce plan immutability: once created, the plan must not change.
interviewSessionSchema.path('interviewPlan').immutable(true);

// Add indexes for common queries
interviewSessionSchema.index({ user: 1, status: 1 });
interviewSessionSchema.index({ documentId: 1 });
interviewSessionSchema.index({ createdAt: -1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
