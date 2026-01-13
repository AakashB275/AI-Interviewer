import InterviewSession from '../models/interviewSession.js';
import { DocumentModel } from '../models/document.js';
import vectorSearchService from '../services/vectorSearchService.js';
import llmService from '../services/llmService.js';
import { ResumeAnalysisAgent } from '../agents/ResumeAnalysisAgent.js';
import { InterviewPlannerAgent } from '../agents/InterviewPlannerAgent.js';

/**
 * START INTERVIEW
 * Creates a session and returns the first question
 * Difficulty is automatically determined based on resume analysis
 */
export async function startInterview(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { documentId, role } = req.body;

    if (!documentId || !role) {
      return res.status(400).json({ success: false, error: 'documentId and role are required' });
    }

    // Get document content for resume analysis
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Analyze resume to determine experience level
    const resumeAnalysisAgent = new ResumeAnalysisAgent({
      text: document.content,
      metadata: document.metadata
    });
    const resumeAnalysis = await resumeAnalysisAgent.run();

    // Determine difficulty based on years of experience
    // This matches the logic in InterviewPlannerAgent:
    // years >= 5 ? 'hard' : years >= 2 ? 'medium' : 'easy'
    const years = Number(resumeAnalysis.estimatedYearsExperience || 0);
    const difficulty = years >= 5 ? 'hard' : years >= 2 ? 'medium' : 'easy';

    // Create session with auto-determined difficulty
    const session = await InterviewSession.create({
      user: userId,
      documentId,
      role,
      difficulty,
      status: 'active',
      startedAt: new Date()
    });

    // Retrieve resume chunks (projects first)
    const chunks = await vectorSearchService.search({
      documentId,
      query: 'most complex project and backend experience',
      limit: 4
    });

    // Generate first question
    const question = await llmService.generateQuestion({
      role,
      difficulty,
      resumeChunks: chunks.map(chunk => ({ chunkText: chunk.chunkText || chunk.text || '' }))
    });

    session.currentQuestion = {
      text: question.text,
      competency: question.competency,
      difficulty,
      askedAt: new Date()
    };

    await session.save();

    return res.json({
      success: true,
      sessionId: session._id,
      question: question.text,
      difficulty // Return the determined difficulty
    });
  } catch (err) {
    console.error('startInterview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start interview' });
  }
}

/**
 * SUBMIT ANSWER
 * Evaluates answer and returns next question or feedback
 */
export async function submitAnswer(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

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

    // Evaluate answer
    const evaluation = await llmService.evaluateAnswer({
      question: currentQuestion.text,
      answer,
      competency: currentQuestion.competency,
      difficulty: currentQuestion.difficulty
    });

    // Save history
    session.questionHistory.push({
      text: currentQuestion.text,
      competency: currentQuestion.competency,
      difficulty: currentQuestion.difficulty,
      evaluation: {
        depth: evaluation.depth,
        coverage: evaluation.coverage,
        strengths: evaluation.strengths || [],
        gaps: evaluation.gaps || [],
        summary: evaluation.summary || '',
        followUpRecommended: evaluation.followUpRecommended || false
      }
    });

    // Update progress
    session.progress = session.progress || {};
    if (evaluation.gaps?.length) {
      session.progress.weaknesses = [
        ...(session.progress.weaknesses || []),
        currentQuestion.competency
      ];
    } else {
      session.progress.strengths = [
        ...(session.progress.strengths || []),
        currentQuestion.competency
      ];
    }

    // Decide next step
    let nextQuestionText = null;
    let nextQuestion = null;

    if (evaluation.followUpRecommended && evaluation.gaps?.length > 0) {
      const followUpText = await llmService.generateFollowUp({
        previousQuestion: currentQuestion.text,
        gaps: evaluation.gaps
      });
      nextQuestionText = followUpText;
      session.currentQuestion = {
        text: followUpText,
        competency: currentQuestion.competency, // Keep same competency for follow-up
        difficulty: currentQuestion.difficulty,
        askedAt: new Date()
      };
    } else {
      const chunks = await vectorSearchService.search({
        documentId: session.documentId,
        query: 'next important skill or project',
        limit: 3
      });

      nextQuestion = await llmService.generateQuestion({
        role: session.role,
        difficulty: session.difficulty,
        resumeChunks: chunks.map(chunk => ({ chunkText: chunk.chunkText || chunk.text || '' }))
      });

      nextQuestionText = nextQuestion.text;
      session.currentQuestion = {
        text: nextQuestion.text,
        competency: nextQuestion.competency,
        difficulty: session.difficulty,
        askedAt: new Date()
      };
    }

    await session.save();

    return res.json({
      success: true,
      feedback: evaluation.summary,
      question: nextQuestionText
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
    const userId = req.user?._id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.json({ success: true });
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
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const sessions = await InterviewSession.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, sessions });
  } catch (err) {
    console.error('getUserSessions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
}
