import mongoose from 'mongoose';
import { chunkModel } from '../models/chunks.js';
import { generateEmbedding } from './embeddingService.js';


function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: stored=${vecA.length}, query=${vecB.length}. ` +
      'Delete existing chunks and re-upload the resume so all chunks use the ' +
      'current embedding provider.'
    );
  }

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

class VectorSearchService {

  /**
   * @private
   */
  async _atlasSearchByDocument({ documentId, queryEmbedding, limit }) {
    const indexName = process.env.ATLAS_VECTOR_INDEX_NAME || 'chunks_vector_index';

    const docOid = new mongoose.Types.ObjectId(documentId);

    const pipeline = [
      {
        $vectorSearch: {
          index:         indexName,
          path:          'embedding',
          queryVector:   queryEmbedding,
          numCandidates: Math.max(limit * 15, 150),
          limit,
          filter: { documentId: { $eq: docOid } }
        }
      },
      {
        $project: {
          _id:        1,
          documentId: 1,
          ownerId:    1,
          chunkText:  1,
          section:    1,
          position:   1,
          similarity: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    return chunkModel.aggregate(pipeline);
  }

  /**
   * @private
   */
  async _atlasSearchByOwner({ ownerId, queryEmbedding, limit }) {
    const indexName = process.env.ATLAS_VECTOR_INDEX_NAME || 'chunks_vector_index';
    const ownerOid  = new mongoose.Types.ObjectId(String(ownerId));

    const pipeline = [
      {
        $vectorSearch: {
          index:         indexName,
          path:          'embedding',
          queryVector:   queryEmbedding,
          numCandidates: Math.max(limit * 15, 150),
          limit,
          filter: { ownerId: { $eq: ownerOid } }
        }
      },
      {
        $project: {
          _id:        1,
          documentId: 1,
          ownerId:    1,
          chunkText:  1,
          section:    1,
          similarity: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    return chunkModel.aggregate(pipeline);
  }


  async _cosineSearchByDocument({ documentId, queryEmbedding, limit, section }) {
    const filter = { documentId };
    if (section) filter.section = section;

    const chunks = await chunkModel.find(filter).lean();

    if (!chunks || chunks.length === 0) {
      console.warn(`No chunks found for documentId: ${documentId}`);
      return [];
    }

    const scored = chunks
      .map((chunk) => {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          console.warn(`Chunk ${chunk._id} has no embedding — skipping`);
          return null;
        }
        if (chunk.embedding.length !== queryEmbedding.length) {
          console.warn(
            `Dimension mismatch on chunk ${chunk._id}: ` +
            `stored=${chunk.embedding.length}, query=${queryEmbedding.length} — skipping`
          );
          return null;
        }
        return {
          ...chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
        };
      })
      .filter(Boolean);

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  async _cosineSearchByOwner({ ownerId, queryEmbedding, limit }) {
    const chunks = await chunkModel.find({ ownerId }).lean();
    if (!chunks || chunks.length === 0) return [];

    const scored = chunks
      .map((chunk) => {
        if (!chunk.embedding || chunk.embedding.length !== queryEmbedding.length) return null;
        return { ...chunk, similarity: cosineSimilarity(queryEmbedding, chunk.embedding) };
      })
      .filter(Boolean);

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  /**
   *
   * @param {Object}  params
   * @param {string}  params.documentId
   * @param {string}  params.query       
   * @param {number}  [params.limit=5]
   * @param {string}  [params.section]   Optional section filter (cosine mode only)
   * @returns {Promise<Array>}
   */
  async search({ documentId, query, limit = 5, section = null } = {}) {
    if (!documentId) throw new Error('documentId is required');
    if (!query || !query.trim()) throw new Error('query is required');

    const useAtlas = (process.env.USE_ATLAS_VECTOR_SEARCH || 'false').toLowerCase() === 'true';

    try {
      const queryEmbedding = await generateEmbedding(query.trim());

      if (useAtlas) {
        // console.log(`[Atlas] $vectorSearch: "${query.slice(0, 60)}" in doc ${documentId}`);
        const results = await this._atlasSearchByDocument({ documentId, queryEmbedding, limit });
        // console.log(`[Atlas] found ${results.length} chunks`);
        return results;
      }

      // console.log(`[Cosine] search: "${query.slice(0, 60)}" in doc ${documentId}`);
      const results = await this._cosineSearchByDocument({
        documentId, queryEmbedding, limit, section
      });
      // console.log(`[Cosine] found ${results.length} chunks`);
      return results;

    } catch (error) {
      console.error('Vector search error:', error.message);
      throw error;
    }
  }

  /**
   * Search across ALL documents owned by a user.
   *
   * @param {Object}  params
   * @param {string}  params.ownerId
   * @param {string}  params.query
   * @param {number}  [params.limit=5]
   * @returns {Promise<Array>}
   */
  async searchByOwner({ ownerId, query, limit = 5 } = {}) {
    if (!ownerId)             throw new Error('ownerId is required');
    if (!query || !query.trim()) throw new Error('query is required');

    const useAtlas = (process.env.USE_ATLAS_VECTOR_SEARCH || 'false').toLowerCase() === 'true';

    try {
      const queryEmbedding = await generateEmbedding(query.trim());

      if (useAtlas) {
        // console.log(`[Atlas] $vectorSearch by owner ${ownerId}: "${query.slice(0, 60)}"`);
        const results = await this._atlasSearchByOwner({ ownerId, queryEmbedding, limit });
        // console.log(`[Atlas] found ${results.length} chunks`);
        return results;
      }

      // console.log(`[Cosine] search by owner ${ownerId}: "${query.slice(0, 60)}"`);
      const results = await this._cosineSearchByOwner({ ownerId, queryEmbedding, limit });
      // console.log(`[Cosine] found ${results.length} chunks`);
      return results;

    } catch (error) {
      console.error('Vector search by owner error:', error.message);
      throw error;
    }
  }
}

export default new VectorSearchService();