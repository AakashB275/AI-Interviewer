import { chunkModel } from '../models/chunks.js';
import { generateEmbedding } from './embeddingService.js';

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Similarity score between -1 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Vector search service for finding relevant document chunks
 * Uses cosine similarity to find chunks most similar to the query
 */
class VectorSearchService {
  /**
   * Search for relevant chunks using vector similarity
   * @param {Object} params
   * @param {string} params.documentId - Document ID to search within
   * @param {string} params.query - Search query text
   * @param {number} params.limit - Maximum number of results (default: 5)
   * @param {string} params.section - Optional section filter (education, experience, projects, etc.)
   * @returns {Promise<Array>} Array of chunk objects with similarity scores
   */
  async search({ documentId, query, limit = 5, section = null } = {}) {
    if (!documentId) {
      throw new Error('documentId is required');
    }
    if (!query || !query.trim()) {
      throw new Error('query is required');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query.trim());

      // Build filter query
      const filter = { documentId };
      if (section) {
        filter.section = section;
      }

      // Fetch all chunks for the document (or use MongoDB Atlas Vector Search if available)
      const chunks = await chunkModel.find(filter).lean();

      if (!chunks || chunks.length === 0) {
        console.warn(`No chunks found for documentId: ${documentId}`);
        return [];
      }

      // Calculate similarity scores
      const chunksWithScores = chunks.map(chunk => {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          console.warn(`Chunk ${chunk._id} has no embedding`);
          return null;
        }

        // Ensure embeddings have same dimension
        if (chunk.embedding.length !== queryEmbedding.length) {
          console.warn(`Dimension mismatch: chunk=${chunk.embedding.length}, query=${queryEmbedding.length}`);
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

        return {
          ...chunk,
          similarity,
          chunkText: chunk.chunkText,
          section: chunk.section,
          position: chunk.position
        };
      }).filter(chunk => chunk !== null);

      // Sort by similarity (descending) and return top N
      chunksWithScores.sort((a, b) => b.similarity - a.similarity);

      return chunksWithScores.slice(0, limit);
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * Search across multiple documents (for user's all documents)
   * @param {Object} params
   * @param {string} params.ownerId - User ID
   * @param {string} params.query - Search query
   * @param {number} params.limit - Maximum results
   * @returns {Promise<Array>} Array of chunks with similarity scores
   */
  async searchByOwner({ ownerId, query, limit = 5 } = {}) {
    if (!ownerId) {
      throw new Error('ownerId is required');
    }
    if (!query || !query.trim()) {
      throw new Error('query is required');
    }

    try {
      const queryEmbedding = await generateEmbedding(query.trim());
      const chunks = await chunkModel.find({ ownerId }).lean();

      if (!chunks || chunks.length === 0) {
        return [];
      }

      const chunksWithScores = chunks.map(chunk => {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          return null;
        }
        if (chunk.embedding.length !== queryEmbedding.length) {
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          ...chunk,
          similarity,
          chunkText: chunk.chunkText,
          section: chunk.section
        };
      }).filter(chunk => chunk !== null);

      chunksWithScores.sort((a, b) => b.similarity - a.similarity);
      return chunksWithScores.slice(0, limit);
    } catch (error) {
      console.error('Vector search by owner error:', error);
      throw error;
    }
  }
}

export default new VectorSearchService();
