import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

let openaiClient = null;
let geminiClient = null;

/**
 * Get OpenAI client instance
 */
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Get Gemini client instance (fallback)
 */
function getGeminiClient() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  return geminiClient;
}

/**
 * LLM Service for interview question generation and answer evaluation
 */
class LLMService {
  /**
   * Generate interview question based on role, difficulty, and resume context
   * @param {Object} params
   * @param {string} params.role - Job role (e.g., "Software Engineer", "Data Scientist")
   * @param {string} params.difficulty - Question difficulty (easy, medium, hard)
   * @param {Array} params.resumeChunks - Array of relevant resume chunks with text
   * @returns {Promise<Object>} Question object with text and competency
   */
  async generateQuestion({ role, difficulty = 'medium', resumeChunks = [] } = {}) {
    if (!role) {
      throw new Error('role is required');
    }

    try {
      // Build context from resume chunks
      const context = resumeChunks
        .map((chunk, idx) => `[Chunk ${idx + 1}]: ${chunk.chunkText || chunk.text || ''}`)
        .join('\n\n');

      const prompt = `You are an expert technical interviewer conducting an interview for a ${role} position.

Resume Context:
${context || 'No specific resume context provided.'}

Generate a ${difficulty}-level technical interview question that:
1. Is relevant to the ${role} position
2. Tests practical knowledge and experience
3. Can be answered in 2-3 minutes
4. Is appropriate for ${difficulty} difficulty level
5. Relates to the candidate's background if context is provided

Respond ONLY with a JSON object in this exact format:
{
  "text": "Your question here",
  "competency": "The skill/competency being tested (e.g., 'System Design', 'JavaScript', 'Problem Solving')",
  "difficulty": "${difficulty}",
  "expectedAnswerLength": "2-3 minutes"
}`;

      // Try OpenAI first, fallback to Gemini
      try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates interview questions. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        const question = JSON.parse(content);
        return {
          text: question.text || 'Tell me about your experience.',
          competency: question.competency || 'General',
          difficulty: question.difficulty || difficulty
        };
      } catch (openaiError) {
        console.warn('OpenAI failed, trying Gemini:', openaiError.message);
        
        // Fallback to Gemini
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const question = JSON.parse(jsonMatch[0]);
          return {
            text: question.text || 'Tell me about your experience.',
            competency: question.competency || 'General',
            difficulty: question.difficulty || difficulty
          };
        }

        // Fallback response if JSON parsing fails
        return {
          text: text.split('\n')[0] || 'Tell me about your experience.',
          competency: 'General',
          difficulty: difficulty
        };
      }
    } catch (error) {
      console.error('Error generating question:', error);
      // Return a fallback question
      return {
        text: `Tell me about your experience with ${role} and what interests you most about this position.`,
        competency: 'General',
        difficulty: difficulty
      };
    }
  }

  /**
   * Evaluate candidate's answer
   * @param {Object} params
   * @param {string} params.question - The question that was asked
   * @param {string} params.answer - Candidate's answer
   * @param {string} params.competency - The competency being tested
   * @param {string} params.difficulty - Question difficulty
   * @returns {Promise<Object>} Evaluation object with scores and feedback
   */
  async evaluateAnswer({ question, answer, competency, difficulty = 'medium' } = {}) {
    if (!question || !answer) {
      throw new Error('question and answer are required');
    }

    try {
      const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

Question: ${question}
Competency: ${competency}
Difficulty: ${difficulty}

Candidate's Answer: ${answer}

Evaluate the answer and provide:
1. Depth of understanding (1-5 scale)
2. Coverage of the topic (1-5 scale)
3. Key strengths in the answer
4. Gaps or areas for improvement
5. Whether a follow-up question is recommended

Respond ONLY with a JSON object in this exact format:
{
  "depth": "1-5",
  "coverage": "1-5",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "summary": "Brief evaluation summary",
  "followUpRecommended": true/false
}`;

      try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that evaluates interview answers. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from OpenAI');
        }

        const evaluation = JSON.parse(content);
        return {
          depth: evaluation.depth || '3',
          coverage: evaluation.coverage || '3',
          strengths: evaluation.strengths || [],
          gaps: evaluation.gaps || [],
          summary: evaluation.summary || 'Answer received and evaluated.',
          followUpRecommended: evaluation.followUpRecommended || false
        };
      } catch (openaiError) {
        console.warn('OpenAI failed, trying Gemini:', openaiError.message);
        
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const evaluation = JSON.parse(jsonMatch[0]);
          return {
            depth: evaluation.depth || '3',
            coverage: evaluation.coverage || '3',
            strengths: evaluation.strengths || [],
            gaps: evaluation.gaps || [],
            summary: evaluation.summary || 'Answer received and evaluated.',
            followUpRecommended: evaluation.followUpRecommended || false
          };
        }

        // Fallback evaluation
        return {
          depth: '3',
          coverage: '3',
          strengths: ['Answer provided'],
          gaps: [],
          summary: 'Answer received.',
          followUpRecommended: false
        };
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        depth: '3',
        coverage: '3',
        strengths: [],
        gaps: [],
        summary: 'Evaluation completed.',
        followUpRecommended: false
      };
    }
  }

  /**
   * Generate follow-up question based on gaps in previous answer
   * @param {Object} params
   * @param {string} params.previousQuestion - Previous question text
   * @param {Array} params.gaps - Identified gaps in the answer
   * @returns {Promise<string>} Follow-up question text
   */
  async generateFollowUp({ previousQuestion, gaps = [] } = {}) {
    if (!previousQuestion) {
      throw new Error('previousQuestion is required');
    }

    try {
      const prompt = `Generate a follow-up interview question that addresses these gaps: ${gaps.join(', ')}

Previous question: ${previousQuestion}

Create a concise follow-up question that probes deeper into the areas where the candidate needs to improve.

Respond with ONLY the question text, no additional explanation.`;

      try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        });

        return response.choices[0]?.message?.content?.trim() || 
               'Can you elaborate on that?';
      } catch (openaiError) {
        console.warn('OpenAI failed, trying Gemini:', openaiError.message);
        
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        return response.text().trim() || 'Can you elaborate on that?';
      }
    } catch (error) {
      console.error('Error generating follow-up:', error);
      return 'Can you elaborate on that?';
    }
  }
}

export default new LLMService();
