import mongoose, { Schema, Document } from "mongoose";

// export interface IChunk extends Document {
//   documentId: mongoose.Types.ObjectId;
//   ownerId: mongoose.Types.ObjectId;
//   chunkText: string;
//   embedding: number[];
//   position: number;
// }

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
    }
  },
  { timestamps: true }
);

export const chunkModel = mongoose.model("chunks", chunkSchema);
