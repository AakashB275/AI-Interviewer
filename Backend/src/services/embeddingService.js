import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;

export function getOpenAIClient(){
    if(!process.env.OPENAI_API_KEY){
        console.error("OPENAI_API_KEY is missing");
        throw new Error("OpenAI API key not configured")
    }

    if(!client){
        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return client;
}

export async function generateEmbedding(text){
    try{
        const openai = getOpenAIClient();
        const res = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input:text,
        });

        const embedding = res.data[0]?.embedding;

        if(!embedding|| embedding.length === 0){
            console.error("Embedding generated bu empty")
            throw new Error("Empty embedding received");
        }
        console.log("Embedding generated:", embedding.length);
        return embedding;
    }
    catch(err){
        if(err.code === "ENOTFOUND"){
            console.error("Network error: No internet connection")
        }
        else if(err.status === 401){
            console.error("Invalid OpenAI API Key");
        }
        else{
            console.error("Embedding error:", err.message);
        }
        throw err;
    }
}

// gemini version incase openai key fails, have to change this part manually

export function getGeminiClient() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is missing");
    throw new Error("Gemini API key not configured");
  }

  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  return client;
}

export async function generateEmbedding(text) {
  try {
    const genAI = getGeminiClient();

    const model = genAI.getGenerativeModel({
      model: "text-embedding-004", 
    });

    const result = await model.embedContent(text);

    const embedding = result?.embedding?.values;

    if (!embedding || embedding.length === 0) {
      console.error("Embedding generated but empty");
      throw new Error("Empty embedding received");
    }

    console.log("Embedding generated:", embedding.length);
    return embedding;
  } catch (err) {
    if (err.message?.includes("fetch failed")) {
      console.error("Network error: No internet connection");
    } else if (err.status === 401 || err.message?.includes("API key")) {
      console.error("Invalid Gemini API Key");
    } else {
      console.error("Gemini embedding error:", err.message);
    }
    throw err;
  }
}