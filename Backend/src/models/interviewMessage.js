import mongoose from 'mongoose';

const interviewMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewSession",
    required: true
  },

  role: {
    type: String,
    // interviewer is our backend "AI interviewer" voice; system is reserved for meta/instructions
    enum: ["candidate", "interviewer", "system"],
    required: true
  },

  // Optional metadata (kept non-required to avoid breaking runtime writes)
  jobRole: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },

  // Canonical message payload
  content: { type: String, required: true },
  // Back-compat alias (older code wrote `message`)
  message: { type: String },

  messageType: {
    type: String,
    enum: ["question", "answer", "instruction", "feedback"],
    default: "answer"
  },

  // aiMetadata: {
  //   model: String,
  //   promptVersion: String,
  //   temperature: Number
  // },

  // Optional ordering field; we mostly rely on createdAt sorting
  sequence: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

const InterviewMessage = mongoose.model('InterviewMessage', interviewMessageSchema);

export default InterviewMessage;
