import mongoose from 'mongoose';

const interviewMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewSession",
    required: true
  },

  role: {
    type: String,
    // interviewer is our backend "AI interviewer" voice;
    enum: ["candidate", "interviewer"],
    required: true
  },
  //was used before chaning the jobRole to roleafter changing the schema a bit
  jobRole: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },

  content: { type: String, required: true },
  message: { type: String },

  messageType: {
    type: String,
    enum: ["question", "answer", "instruction", "feedback", "follow-up"],
    default: "answer"
  },

  // aiMetadata: {
  //   model: String,
  //   promptVersion: String,
  //   temperature: Number
  // },

  sequence: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

const InterviewMessage = mongoose.model('InterviewMessage', interviewMessageSchema);

export default InterviewMessage;
