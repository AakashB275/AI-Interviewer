import mongoose from "mongoose";

const interviewMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewSession", required: true },

  role: { type: String, enum: ["interviewer", "candidate", "system"], required: true },

  message: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("InterviewMessage", interviewMessageSchema);
