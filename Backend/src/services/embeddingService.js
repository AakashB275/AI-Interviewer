import axios from 'axios';

// import OpenAI from "openai";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// let openaiClient = null;
// let geminiClient = null;

// export function getOpenAIClient() {
//   if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");
//   if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//   return openaiClient;
// }

// export function getGeminiClient() {
//   if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");
//   if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
//   return geminiClient;
// }

// export async function generateEmbeddingOpenAI(text) {
//   const openai = getOpenAIClient();
//   const res = await openai.embeddings.create({
//     model: "text-embedding-3-small",   // 1536 dims
//     input: text,
//   });
//   const embedding = res.data[0]?.embedding;
//   if (!embedding || embedding.length === 0) throw new Error("Empty embedding from OpenAI");
//   console.log("OpenAI embedding dim:", embedding.length);
//   return embedding;
// }

// export async function generateEmbeddingGemini(text) {
//   const genAI = getGeminiClient();
//   const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
//   const result = await model.embedContent(text);
//   const embedding = result?.embedding?.values;   // 768 dims
//   if (!embedding || embedding.length === 0) throw new Error("Empty embedding from Gemini");
//   console.log("Gemini embedding dim:", embedding.length);
//   return embedding;
// }

// Old router (was defaulting to Gemini):
// export async function generateEmbedding(text) {
//   const provider = (process.env.EMBEDDING_PROVIDER || "gemini").toLowerCase();
//   if (provider === "openai") return generateEmbeddingOpenAI(text);
//   return generateEmbeddingGemini(text);
// }

function meanPool(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = new Array(cols).fill(0);
  for (const row of matrix) {
    for (let j = 0; j < cols; j++) result[j] += row[j];
  }
  return result.map((v) => v / rows);
}

const HF_DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

export async function generateEmbeddingHuggingFace(text) {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error(
      'HF_API_TOKEN is not set. ' +
      'Get a free read-only token at https://huggingface.co/settings/tokens'
    );
  }

  const model = process.env.HF_MODEL || HF_DEFAULT_MODEL;
  const url   = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;

  const response = await axios.post(
    url,
    { inputs: text, options: { wait_for_model: true } },
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    }
  );

  const data = response.data;

  // sentence-transformers returns flat [dim]; some models return [[dim], ...]
  let embedding;
  if (Array.isArray(data) && Array.isArray(data[0])) {
    embedding = meanPool(data);
  } else if (Array.isArray(data)) {
    embedding = data;
  } else {
    throw new Error(
      'Unexpected HuggingFace response shape: ' +
      JSON.stringify(data).slice(0, 200)
    );
  }

  if (!embedding || embedding.length === 0) {
    throw new Error('Empty embedding from HuggingFace');
  }

  console.log(`HuggingFace embedding dim: ${embedding.length} (model: ${model})`);
  return embedding;
}

let _transformerPipeline = null;

/**
 * Generate embedding using @xenova/transformers running inside Node.js.
 * Install once : npm install @xenova/transformers
 * The ~25 MB model is auto-downloaded on first use, then cached locally.
 * Output : 384-dim float array (same dimension as HuggingFace provider above)
 */
export async function generateEmbeddingTransformers(text) {
  if (!_transformerPipeline) {
    let pipeline;
    try {
      const mod = await import('@xenova/transformers');
      pipeline = mod.pipeline;
    } catch {
      throw new Error(
        '@xenova/transformers is not installed. ' +
        'Run: cd Backend && npm install @xenova/transformers'
      );
    }

    console.log('Loading local embedding model (first run downloads ~25 MB, then cached)...');
    _transformerPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Local embedding model ready.');
  }

  const output = await _transformerPipeline(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data); // Float32Array → plain JS Array

  if (!embedding || embedding.length === 0) {
    throw new Error('Empty embedding from @xenova/transformers');
  }

  console.log(`Transformers.js embedding dim: ${embedding.length}`);
  return embedding;
}

/**
 * Generate embedding via a locally running Ollama instance.
 * Install Ollama : https://ollama.ai
 * Pull model     : ollama pull nomic-embed-text
 * Output         : 768-dim float array
 */
export async function generateEmbeddingOllama(text) {
  const baseUrl = process.env.OLLAMA_BASE_URL  || 'http://localhost:11434';
  const model   = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

  const response = await axios.post(
    `${baseUrl}/api/embeddings`,
    { model, prompt: text },
    { timeout: 30_000 }
  );

  const embedding = response.data?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error('Empty embedding from Ollama');
  }

  console.log(`Ollama embedding dim: ${embedding.length} (model: ${model})`);
  return embedding;
}

/**
 * @param   {string}   text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const provider = (process.env.EMBEDDING_PROVIDER || 'huggingface').toLowerCase();

  if (provider === 'ollama') {
    return generateEmbeddingOllama(text);
  }

  if (provider === 'transformers') {
    return generateEmbeddingTransformers(text);
  }

  // Default: HuggingFace with silent local fallback
  try {
    return await generateEmbeddingHuggingFace(text);
  } catch (hfErr) {
    console.warn(
      `HuggingFace embedding failed (${hfErr.message}). ` +
      'Falling back to local @xenova/transformers...'
    );
    return generateEmbeddingTransformers(text);
  }
}

export default {
  generateEmbedding,
  generateEmbeddingHuggingFace,
  generateEmbeddingTransformers,
  generateEmbeddingOllama,
  // Re-enable these when paid credits are available:
  // generateEmbeddingOpenAI,
  // generateEmbeddingGemini,
};