import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let openaiClient = null;
let geminiClient = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

export function getGeminiClient() {
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  return geminiClient;
}

export async function generateEmbeddingOpenAI(text) {
  const openai = getOpenAIClient();
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  const embedding = res.data[0]?.embedding;
  if (!embedding || embedding.length === 0) throw new Error("Empty embedding from OpenAI");
  console.log("OpenAI embedding dim:", embedding.length);
  return embedding;
}

export async function generateEmbeddingGemini(text) {
  const genAI = getGeminiClient();
const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result?.embedding?.values;
  if (!embedding || embedding.length === 0) throw new Error("Empty embedding from Gemini");
  console.log("Gemini embedding dim:", embedding.length);
  return embedding;
}

export async function generateEmbedding(text) {
  const provider = (process.env.EMBEDDING_PROVIDER || "gemini").toLowerCase();

  if (provider === "openai") {
    return generateEmbeddingOpenAI(text);
  }

 
  return generateEmbeddingGemini(text);
}

export default { generateEmbedding, generateEmbeddingOpenAI, generateEmbeddingGemini };