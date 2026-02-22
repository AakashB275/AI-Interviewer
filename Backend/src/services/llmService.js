import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

let openaiClient = null;
let geminiClient = null;
let groqClient = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

function getGeminiClient() {
  if (!process.env.GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY is not configured');
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  return geminiClient;
}

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

const GROQ_MODEL  = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

async function chatOpenAICompat(client, model, systemPrompt, userPrompt, opts = {}) {
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   }
    ],
    temperature: opts.temperature ?? 0.7,
    ...(opts.maxTokens  ? { max_tokens: opts.maxTokens } : {}),
    ...(opts.jsonMode   ? { response_format: { type: 'json_object' } } : {})
  });
  return res.choices[0]?.message?.content || '';
}

async function chatGemini(prompt) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in LLM response');
  return JSON.parse(match[0]);
}

async function callLLM({ systemPrompt, userPrompt, temperature = 0.7, maxTokens, jsonMode = false }) {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();

  const tryGroq = async () =>
    chatOpenAICompat(getGroqClient(), GROQ_MODEL, systemPrompt, userPrompt, { temperature, maxTokens, jsonMode });

  const tryOpenAI = async () =>
    chatOpenAICompat(getOpenAIClient(), process.env.OPENAI_MODEL || 'gpt-4o-mini', systemPrompt, userPrompt, { temperature, maxTokens, jsonMode });

  const tryGemini = async () =>
    chatGemini(`${systemPrompt}\n\n${userPrompt}`);

  const order = {
    groq:   [tryGroq,   tryOpenAI, tryGemini],
    openai: [tryOpenAI, tryGroq,   tryGemini],
    gemini: [tryGemini, tryGroq,   tryOpenAI],
  }[provider] || [tryGroq, tryOpenAI, tryGemini];

  for (const fn of order) {
    try { return await fn(); } catch (e) { console.warn(`LLM attempt failed: ${e.message}`); }
  }
  throw new Error('All LLM providers failed');
}

function formatResumeContext(resumeChunks = []) {
  if (!resumeChunks || resumeChunks.length === 0) return null;
  return resumeChunks
    .map((c, i) => `[Resume Excerpt ${i + 1}]: ${(c.chunkText || c.text || '').trim()}`)
    .join('\n\n');
}

class LLMService {

  /**
   * Generate initial interview question using resume context
   * @param {Object} params
   * @param {string} params.role
   * @param {string} params.difficulty
   * @param {Array}  params.resumeChunks - relevant chunks from vector search
   */
  async generateQuestion({ role, difficulty = 'medium', resumeChunks = [] } = {}) {
    if (!role) throw new Error('role is required');

    const resumeContext = formatResumeContext(resumeChunks);

    const systemPrompt = 'You are an expert technical interviewer. Always respond with valid JSON only.';

    const userPrompt = `You are interviewing a candidate for a ${role} position.

${resumeContext
  ? `Candidate's Resume Background:\n${resumeContext}\n\nGenerate a ${difficulty}-level question that is SPECIFIC to what the candidate has actually worked on above. Reference their real projects, technologies, or achievements.`
  : `Generate a ${difficulty}-level technical interview question relevant to the ${role} position.`
}

Rules:
- The question must be answerable in 2-3 minutes
- Do NOT ask generic textbook questions if resume context is available
- Make the candidate feel you've read their resume

Respond ONLY with:
{
  "text": "Your specific question here",
  "competency": "The skill being tested",
  "difficulty": "${difficulty}"
}`;

    try {
      const raw = await callLLM({ systemPrompt, userPrompt, temperature: 0.7, jsonMode: true });
      const q = parseJSON(raw);
      return {
        text:       q.text       || `Tell me about your experience with ${role}.`,
        competency: q.competency || 'General',
        difficulty: q.difficulty || difficulty
      };
    } catch (err) {
      console.error('generateQuestion failed:', err.message);
      return {
        text:       `Tell me about your experience with ${role} and what interests you about this position.`,
        competency: 'General',
        difficulty
      };
    }
  }

  /**
   * Evaluate candidate's answer
   */
  async evaluateAnswer({ question, answer, competency, difficulty = 'medium' } = {}) {
    if (!question || !answer) throw new Error('question and answer are required');

    const systemPrompt = 'You are an expert interviewer evaluating answers. Always respond with valid JSON only.';
    const userPrompt = `Evaluate this interview answer.

Question: ${question}
Competency: ${competency}
Difficulty: ${difficulty}
Answer: ${answer}

Respond ONLY with:
{
  "depth": "1-5",
  "coverage": "1-5",
  "strengths": ["strength1"],
  "gaps": ["gap1"],
  "summary": "Brief evaluation",
  "followUpRecommended": true
}`;

    try {
      const raw = await callLLM({ systemPrompt, userPrompt, temperature: 0.3, jsonMode: true });
      const ev = parseJSON(raw);
      return {
        depth:               ev.depth               || '3',
        coverage:            ev.coverage            || '3',
        strengths:           ev.strengths           || [],
        gaps:                ev.gaps                || [],
        summary:             ev.summary             || 'Answer evaluated.',
        followUpRecommended: ev.followUpRecommended || false
      };
    } catch (err) {
      console.error('evaluateAnswer failed:', err.message);
      return { depth: '3', coverage: '3', strengths: [], gaps: [], summary: 'Evaluation completed.', followUpRecommended: false };
    }
  }

  /**
   * Legacy simple follow-up
   */
  async generateFollowUp({ previousQuestion, gaps = [] } = {}) {
    if (!previousQuestion) throw new Error('previousQuestion is required');

    const systemPrompt = 'You are an expert interviewer. Respond with only a single follow-up question.';
    const userPrompt = `Generate a follow-up question addressing these gaps: ${gaps.join(', ')}
Previous question: ${previousQuestion}
Respond with ONLY the question text.`;

    try {
      const text = await callLLM({ systemPrompt, userPrompt, temperature: 0.7, maxTokens: 150 });
      return text.trim() || 'Can you elaborate on that?';
    } catch (err) {
      console.error('generateFollowUp failed:', err.message);
      return 'Can you elaborate on that?';
    }
  }

  /**
   * Generate contextual follow-up question using resume chunks
   * @param {Object} params
   * @param {string} params.role
   * @param {string} params.difficulty
   * @param {string} params.skill
   * @param {string} params.candidateAnswer
   * @param {string} params.conversationContext
   * @param {number} params.questionNumber
   * @param {number} params.totalQuestions
   * @param {boolean} params.isFollowUp       
   * @param {Array}  params.resumeChunks       
   */
  async generateFollowUpQuestion({
    role = '',
    difficulty = 'medium',
    skill = 'general',
    candidateAnswer = '',
    conversationContext = '',
    questionNumber = 1,
    totalQuestions = 5,
    isFollowUp = false,
    resumeChunks = []
  } = {}) {
    if (!role) throw new Error('role is required');

    const resumeContext = formatResumeContext(resumeChunks);
    const capitalizedSkill = skill.charAt(0).toUpperCase() + skill.slice(1);

    const systemPrompt = 'You are an expert technical interviewer. Always respond with valid JSON only.';

    let userPrompt;

    if (isFollowUp) {
      // ── Depth-building follow-up on the SAME topic ──────────────────────────
      userPrompt = `You are interviewing a candidate for a ${role} position.

Previous Conversation:
${conversationContext}

The candidate just said:
"${candidateAnswer}"

${resumeContext
  ? `Relevant parts of their resume:\n${resumeContext}\n\nGenerate a follow-up that connects what they just said to something specific in their resume above.`
  : 'Generate a follow-up that digs deeper into what they just said.'
}

The follow-up should:
- Ask for specific examples, numbers, tools, or outcomes
- NOT repeat any previous question
- Show you were actively listening

Respond ONLY with JSON:
{
  "text": "Your specific follow-up question",
  "competency": "${skill}",
  "difficulty": "${difficulty}"
}`;
    } else {
      userPrompt = `You are interviewing a candidate for a ${role} position.

Previous Conversation:
${conversationContext}

The candidate just said:
"${candidateAnswer}"

${resumeContext
  ? `Relevant parts of their resume related to "${skill}":\n${resumeContext}\n\nGenerate question ${questionNumber} of ${totalQuestions} that is SPECIFIC to what's in their resume above AND related to what they just discussed. Reference their actual experience.`
  : `Generate question ${questionNumber} of ${totalQuestions} that is naturally related to what the candidate just said, testing their ${skill} knowledge at ${difficulty} difficulty.`
}

Rules:
- Be specific — reference the candidate's actual resume/answer, not generic knowledge
- Do NOT repeat previous questions
- Difficulty: ${difficulty}

Respond ONLY with JSON:
{
  "text": "Your specific question referencing their background",
  "competency": "Skill being tested (e.g., '${skill}')",
  "difficulty": "${difficulty}"
}`;
    }

    try {
      const raw = await callLLM({ systemPrompt, userPrompt, temperature: 0.8, jsonMode: true });
      const q = parseJSON(raw);
      return {
        text:       q.text       || 'Tell me more about that.',
        competency: q.competency || capitalizedSkill,
        difficulty: q.difficulty || difficulty
      };
    } catch (err) {
      console.error('generateFollowUpQuestion failed:', err.message);
      return {
        text:       'Tell me more about what you just said.',
        competency: capitalizedSkill,
        difficulty
      };
    }
  }
}

export default new LLMService();