import InterviewSession from '../models/interviewSession.js';
import { DocumentModel } from '../models/document.js';
import { ResumeAnalysisAgent } from '../agents/ResumeAnalysisAgent.js';
import { InterviewPlannerAgent } from '../agents/InterviewPlannerAgent.js';
import interviewMessageService from '../services/interviewMessageService.js';
import evaluationService from '../services/evaluationService.js';
import { EvaluationAgent } from '../agents/EvaluationAgent.js';
import { buildTranscript, getRubricForRole, generateDeterministicQuestion } from '../utils/interviewUtils.js';
import vectorSearchService from '../services/vectorSearchService.js';

/**
 * Fetch resume chunks relevant to a given skill/query from vector search.
 * Returns empty array (never throws) so a vector search failure never
 * breaks the interview — it just falls back to generic questions.
 *
 * @param {string} documentId
 * @param {string} query       - skill name or topic to search for
 * @param {number} limit
 */
async function getResumeChunks(documentId, query, limit = 4) {
  if (!documentId || !query) return [];
  try {
    const chunks = await vectorSearchService.search({ documentId, query, limit });
    console.log(`Vector search for "${query}": found ${chunks.length} chunks`);
    return chunks || [];
  } catch (err) {
    // Vector search failure must NEVER crash the interview
    console.warn('Vector search failed (falling back to generic questions):', err.message);
    return [];
  }
}

/**
 * START INTERVIEW
 * Creates a session and returns the first personalized question
 */
export async function startInterview(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { documentId, role } = req.body;
    if (!documentId || !role) {
      return res.status(400).json({ success: false, error: 'documentId and role are required' });
    }

    const document = await DocumentModel.findById(documentId);
    if (!document) return res.status(404).json({ success: false, error: 'Document not found' });

    const resumeAnalysisAgent = new ResumeAnalysisAgent({
      text: document.content,
      metadata: document.metadata
    });
    const resumeAnalysis = await resumeAnalysisAgent.run();

    console.log('Resume Analysis:', {
      years:  resumeAnalysis.estimatedYearsExperience,
      skills: resumeAnalysis.skills
    });

    const planner = new InterviewPlannerAgent({ resumeAnalysis, constraints: { role } });
    const interviewPlan = planner.run();

    console.log('Interview Plan:', {
      questionCount: interviewPlan.questionCount,
      difficulty:    interviewPlan.baseDifficulty,
      skills:        interviewPlan.detectedSkills
    });

    const years = Number(resumeAnalysis.estimatedYearsExperience || 0);
    const difficulty = years >= 5 ? 'hard' : years >= 2 ? 'medium' : 'easy';

    const session = await InterviewSession.create({
      user: userId,
      documentId,
      role,
      difficulty,
      interviewPlan,
      currentQuestionIndex: 0,
      status: 'active',
      startedAt: new Date()
    });

    const firstSpec = interviewPlan?.questions?.[0];
    const openingSkill = firstSpec?.skill || 'general';

    const searchQuery = openingSkill === 'general'
      ? `${role} experience background projects`
      : `${openingSkill} ${role} experience projects`;

    const resumeChunks = await getResumeChunks(String(documentId), searchQuery, 4);

    let question;

    if (resumeChunks.length > 0) {
      console.log('Generating personalised first question with resume context');
      try {
        const llmService = (await import('../services/llmService.js')).default;
        question = await llmService.generateQuestion({
          role,
          difficulty: firstSpec?.difficulty || difficulty,
          resumeChunks
        });
      } catch (err) {
        console.warn('Personalised question generation failed, falling back:', err.message);
        question = generateDeterministicQuestion({
          skill:      openingSkill,
          difficulty: firstSpec?.difficulty || difficulty,
          role,
          index: 0
        });
      }
    } else {
      console.log('No resume chunks found — using deterministic question');
      question = generateDeterministicQuestion({
        skill:      openingSkill,
        difficulty: firstSpec?.difficulty || difficulty,
        role,
        index: 0
      });
    }

    console.log('First question generated:', question.text.slice(0, 80) + '...');

    session.currentQuestion = {
      text:       question.text,
      competency: question.competency,
      difficulty: question.difficulty,
      askedAt:    new Date()
    };
    await session.save();

    await interviewMessageService.saveMessage({
      sessionId:   session._id,
      role:        'interviewer',
      content:     question.text,
      messageType: 'question',
      jobRole:     role,
      difficulty
    });

    return res.json({
      success:    true,
      sessionId:  String(session._id),
      question:   question.text,
      difficulty
    });

  } catch (err) {
    console.error('startInterview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start interview' });
  }
}

/**
 * SUBMIT ANSWER
 * Evaluates answer depth, then returns a personalised next question or follow-up
 */
export async function submitAnswer(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) {
      return res.status(400).json({ success: false, error: 'sessionId and answer are required' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Active session not found' });
    }

    const currentQuestion = session.currentQuestion;
    if (!currentQuestion) {
      return res.status(400).json({ success: false, error: 'No active question in session' });
    }

    await interviewMessageService.saveMessage({
      sessionId,
      role:        'candidate',
      content:     answer,
      messageType: 'answer',
      jobRole:     session.role,
      difficulty:  session.difficulty
    });

    if (!session.conversationDepth) {
      session.conversationDepth = { currentTopicIndex: 0, answerCount: 0, lastAnswerLength: 0, shouldMoveToNextTopic: false };
    }
    session.conversationDepth.answerCount     += 1;
    session.conversationDepth.lastAnswerLength = answer.length;

    const isBriefAnswer  = answer.trim().length < 80;
    const answerCount    = session.conversationDepth.answerCount;
    const shouldFollowUp = isBriefAnswer || answerCount < 2;

    const messages = await interviewMessageService.getMessagesForSession(sessionId);
    const conversationContext = messages
      .filter(m => m.messageType === 'question' || m.messageType === 'answer')
      .slice(-4)
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const llmService = (await import('../services/llmService.js')).default;

    if (shouldFollowUp) {
      console.log('Asking follow-up for depth — answerCount:', answerCount, 'brief:', isBriefAnswer);

      const followUpSkill = currentQuestion.competency || currentQuestion.skill || 'general';
      const resumeChunks = await getResumeChunks(
        String(session.documentId),
        `${followUpSkill} ${session.role}`,
        3
      );

      let followUpQuestion;
      try {
        followUpQuestion = await llmService.generateFollowUpQuestion({
          role:               session.role,
          difficulty:         session.difficulty,
          skill:              followUpSkill,
          candidateAnswer:    answer,
          conversationContext,
          questionNumber:     session.currentQuestionIndex + 1,
          totalQuestions:     session.interviewPlan.questions.length,
          isFollowUp:         true,
          resumeChunks                         
        });
      } catch (err) {
        console.warn('Follow-up generation failed, using fallback:', err.message);
        followUpQuestion = {
          text: isBriefAnswer
            ? 'Can you provide more details about that? What tools or approaches did you use?'
            : 'That\'s interesting — can you tell me more about the outcome or challenges you faced?',
          competency: followUpSkill,
          difficulty: session.difficulty
        };
      }

      await interviewMessageService.saveMessage({
        sessionId,
        role:        'interviewer',
        content:     followUpQuestion.text,
        messageType: 'follow-up',
        jobRole:     session.role,
        difficulty:  followUpQuestion.difficulty
      });

      session.currentQuestion = {
        text:       followUpQuestion.text,
        competency: followUpQuestion.competency,
        difficulty: followUpQuestion.difficulty,
        askedAt:    new Date(),
        isFollowUp: true
      };
      await session.save();

      return res.json({
        success:          true,
        interviewComplete: false,
        question:         followUpQuestion.text,
        isFollowUp:       true
      });
    }

    console.log('Moving to next topic — depth satisfied');

    const plan      = session.interviewPlan;
    const nextIndex = Number(session.currentQuestionIndex || 0) + 1;

    if (nextIndex >= plan.questions.length) {
      return res.json({ success: true, interviewComplete: true });
    }

    session.conversationDepth.answerCount      = 0;
    session.conversationDepth.lastAnswerLength = 0;

    const nextSpec = plan.questions[nextIndex];

    const nextSkill = nextSpec?.skill || 'general';
    const resumeChunks = await getResumeChunks(
      String(session.documentId),
      `${nextSkill} ${session.role} experience projects`,
      4
    );

    console.log('Next question spec:', { nextIndex, skill: nextSkill, difficulty: nextSpec?.difficulty });

    let nextQuestion;
    try {
      nextQuestion = await llmService.generateFollowUpQuestion({
        role:               session.role,
        difficulty:         nextSpec?.difficulty || session.difficulty,
        skill:              nextSkill,
        candidateAnswer:    answer,
        conversationContext,
        questionNumber:     nextIndex + 1,
        totalQuestions:     plan.questions.length,
        isFollowUp:         false,
        resumeChunks                             
      });
    } catch (err) {
      console.error('Next question LLM failed, using deterministic fallback:', err.message);
      nextQuestion = generateDeterministicQuestion({
        skill:      nextSkill,
        difficulty: nextSpec?.difficulty || session.difficulty,
        role:       session.role,
        index:      nextIndex
      });
    }

    if (!nextQuestion?.text) {
      return res.status(500).json({ success: false, error: 'Failed to generate next question' });
    }

    session.currentQuestionIndex = nextIndex;
    session.currentQuestion = {
      text:       nextQuestion.text,
      competency: nextQuestion.competency,
      difficulty: nextQuestion.difficulty,
      askedAt:    new Date()
    };

    await interviewMessageService.saveMessage({
      sessionId,
      role:        'interviewer',
      content:     nextQuestion.text,
      messageType: 'question',
      jobRole:     session.role,
      difficulty:  nextQuestion.difficulty
    });

    await session.save();

    return res.json({
      success:          true,
      interviewComplete: false,
      question:         nextQuestion.text
    });

  } catch (err) {
    console.error('submitAnswer error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process answer' });
  }
}

/**
 * END INTERVIEW
 */
export async function endInterview(req, res) {
  try {
    const userId    = req.user?._id;
    const { sessionId } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const messages   = await interviewMessageService.getMessagesForSession(sessionId);
    const transcript = buildTranscript(messages);
    const rubric     = getRubricForRole(session.role);

    const evaluationAgent = new EvaluationAgent({ transcript, rubric });
    const result = evaluationAgent.run();

    const scores10 = Object.fromEntries(
      Object.entries(result.scores || {}).map(([k, v]) => [k, Math.max(0, Math.min(10, Number(v || 0) * 2))])
    );
    const overall10 = Math.max(0, Math.min(10, Number(result.overallScore || 0) * 2));

    await evaluationService.saveEvaluation({
      sessionId,
      evaluator: 'AI',
      scores:   { ...scores10, overall: overall10 },
      comments: result.notes
    });

    session.status  = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.json({
      success:    true,
      sessionId:  String(sessionId),
      jobRole:    session.role,
      difficulty: session.difficulty,
      durationSeconds: Math.floor((session.endedAt - session.startedAt) / 1000),
      conversationHistory: messages.map(m => ({
        role:      m.role,
        content:   m.content,
        type:      m.messageType,
        timestamp: m.createdAt
      })),
      evaluation: {
        overallScore:      result.overallScore,
        confidenceLevel:   result.confidenceLevel,
        skillBreakdown:    result.scores || {},
        feedback:          result.notes,
        suggestions:       Array.isArray(result.suggestions) ? result.suggestions : [result.notes],
        strengths:         result.strengths         || [],
        areasForImprovement: result.areasForImprovement || []
      }
    });
  } catch (err) {
    console.error('endInterview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to end interview' });
  }
}

/**
 * GET USER SESSIONS
 */
export async function getUserSessions(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const sessions = await InterviewSession.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, sessions });
  } catch (err) {
    console.error('getUserSessions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
}