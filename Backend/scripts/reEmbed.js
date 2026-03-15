/**
 * scripts/reEmbed.js
 *
 * Run this script ONCE when switching embedding providers
 * (e.g., from old OpenAI/Gemini to HuggingFace/Transformers).
 *
 * What it does:
 *   --drop  : Deletes ALL chunks from MongoDB.
 *             Then re-upload resumes through the app UI.  (Recommended)
 *
 *   (no flag): Re-generates embeddings for every existing chunk in-place.
 *              Preserves existing data; slower for large collections.
 *
 * Usage:
 *   cd Backend
 *   node scripts/reEmbed.js --drop      # cleanest — just wipe and re-upload
 *   node scripts/reEmbed.js             # re-embed in-place
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateEmbedding } from '../src/services/embeddingService.js';

dotenv.config();

const DROP_MODE = process.argv.includes('--drop');

const chunkSchema = new mongoose.Schema({
  documentId:     mongoose.Schema.Types.ObjectId,
  ownerId:        mongoose.Schema.Types.ObjectId,
  chunkText:      String,
  embedding:      [Number],
  section:        String,
  embeddingModel: String,
  embeddingDim:   Number,
  position:       Number,
}, { timestamps: true });

const Chunk = mongoose.model('chunks', chunkSchema);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var not set');

  await mongoose.connect(uri, { dbName: 'vector_db', autoIndex: false });
  console.log('Connected to MongoDB');

  if (DROP_MODE) {
    const count = await Chunk.countDocuments();
    await Chunk.deleteMany({});
    console.log(`✅  Dropped ${count} chunks. Now re-upload resumes via the app.`);
    await mongoose.disconnect();
    return;
  }

  // In-place re-embed
  const chunks = await Chunk.find({}).lean();
  console.log(`Found ${chunks.length} chunks to re-embed with provider: ${process.env.EMBEDDING_PROVIDER || 'huggingface'}`);

  let done = 0, failed = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.chunkText);
      await Chunk.findByIdAndUpdate(chunk._id, {
        embedding,
        embeddingModel: process.env.EMBEDDING_PROVIDER || 'huggingface',
        embeddingDim:   embedding.length,
      });
      done++;
      if (done % 10 === 0) console.log(`  ${done} / ${chunks.length} done...`);
    } catch (err) {
      failed++;
      console.error(`  Failed chunk ${chunk._id}: ${err.message}`);
    }
  }

  console.log(`\n✅  Re-embedded: ${done}   Failed: ${failed}`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });