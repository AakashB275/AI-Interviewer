import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  category: String,
  difficulty: String,
  tags: [String],
  text: String,
  followUps: [String]
});

export default mongoose.model("Question", questionSchema);
