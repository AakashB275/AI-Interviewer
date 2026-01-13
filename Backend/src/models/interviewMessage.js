import mongoose from 'mongoose';

const interviewMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewSession",
    required: true
  },

  role: {
    type: String,
    enum: ["candidate", "system"],
    required: true
  },

  jobRole: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },

  content: {
    type: String,
    required: true
  },

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

  sequence: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now }
});

const InterviewMessage = mongoose.model('InterviewMessage', interviewMessageSchema);

export default InterviewMessage;
