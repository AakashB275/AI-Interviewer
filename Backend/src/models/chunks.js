import mongoose, { Schema } from "mongoose";

const chunkSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      index: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    chunkText: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    section: {
      type: String,
      enum: ["education", "experience", "projects", "skills", "summary", "other"],
      index: true
    },
    embeddingModel: {
      type: String,
      required: true
    },
    embeddingDim: {
      type: Number,
      required: true
    },
    position: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1, isActive: 1 });
chunkSchema.index({ ownerId: 1,   isActive: 1 });

export const chunkModel = mongoose.model("chunks", chunkSchema);