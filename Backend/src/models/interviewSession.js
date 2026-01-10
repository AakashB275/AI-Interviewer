import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending','active','paused','ended'], default: 'pending' },
  metadata: { type: Object },
  startedAt: { type: Date },
  endedAt: { type: Date },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('InterviewSession', interviewSessionSchema);
