import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  evaluator: { type: String },
  scores: { type: Object },
  comments: { type: String },
  createdAt: { type: Date, default: Date.now }
});

evaluationSchema.index({ session: 1 });

export default mongoose.model('Evaluation', evaluationSchema);
