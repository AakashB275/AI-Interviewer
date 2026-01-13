import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },

  evaluator: {
    type: String,
    enum: ['AI'],
    required: true
  },

  scores: {
    communication: { type: Number, min: 0, max: 10 },
    problemSolving: { type: Number, min: 0, max: 10 },
    technicalDepth: { type: Number, min: 0, max: 10 },
    confidence: { type: Number, min: 0, max: 10 },
    overall: { type: Number, min: 0, max: 10 }
  },

  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },

  createdAt: { type: Date, default: Date.now }
});

evaluationSchema.index({ session: 1 });
evaluationSchema.index({ createdAt: -1 });

export default mongoose.model('Evaluation', evaluationSchema);
