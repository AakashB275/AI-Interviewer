import InterviewSession from '../models/interviewSession.js';
import { DocumentModel } from '../models/document.js';
import { ResumeAnalysisAgent } from '../agents/ResumeAnalysisAgent.js';
import { InterviewPlannerAgent } from '../agents/InterviewPlannerAgent.js';
import interviewMessageService from '../services/interviewMessageService.js';
import evaluationService from '../services/evaluationService.js';
import { EvaluationAgent } from '../agents/EvaluationAgent.js';
import { buildTranscript, getRubricForRole, generateDeterministicQuestion } from '../utils/interviewUtils.js';


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

    console.log('Resume Analysis Results:', {
      yearsOfExperience: resumeAnalysis.estimatedYearsExperience,
      skillsDetected: resumeAnalysis.skills,
      skillCount: resumeAnalysis.skillsDetected
    });

    const planner = new InterviewPlannerAgent({
      resumeAnalysis,
      constraints: { role }
    });
    const interviewPlan = await planner.run();

    console.log('Interview Plan Generated:', {
      questionCount: interviewPlan.questionCount,
      baseDifficulty: interviewPlan.baseDifficulty,
      skills: interviewPlan.detectedSkills,
      yearsOfExperience: interviewPlan.yearsOfExperience
    });

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
      interviewPlan,
      currentQuestionIndex: 0,
      status: 'active',
      startedAt: new Date()
    });

    // Plan-driven first question (index 0) - deterministic, no LLM
    const plan = interviewPlan;
    const firstSpec = plan?.questions?.[0];
    
    console.log('startInterview - Generating first question:', {
      firstSpec,
      planLength: plan?.questions?.length,
      difficulty
    });
    
    // Generate question deterministically from plan spec
    const question = generateDeterministicQuestion({
      skill: firstSpec?.skill || 'general',
      difficulty: firstSpec?.difficulty || difficulty,
      role,
      index: 0
    });

    console.log('Generated first question:', question);

    session.currentQuestion = {
      text: question.text,
      competency: question.competency,
      difficulty: question.difficulty,
      askedAt: new Date()
    };

    await session.save();

    console.log('Session saved successfully:', {
      sessionId: session._id,
      sessionIdType: typeof session._id,
      sessionIdString: String(session._id)
    });

    await interviewMessageService.saveMessage({
      sessionId: session._id,
      role: 'interviewer',
      content: question.text,
      messageType: 'question',
      jobRole: role,
      difficulty
    });

    const responsePayload = {
      success: true,
      sessionId: String(session._id),  // Ensure it's a string
      question: question.text,
      difficulty // Return the determined difficulty
    };

    console.log('Returning response:', responsePayload);

    return res.json(responsePayload);
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

    // Save candidate's answer
    try {
      await interviewMessageService.saveMessage({
        sessionId,
        role: 'candidate',
        content: answer,
        messageType: 'answer',
        jobRole: session.role,
        difficulty: session.difficulty
      });
    } catch (msgErr) {
      console.error('Error saving candidate answer message:', msgErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save answer message: ' + msgErr.message 
      });
    }

    // Track conversation depth
    if (!session.conversationDepth) {
      session.conversationDepth = {
        currentTopicIndex: 0,
        answerCount: 0,
        lastAnswerLength: 0,
        shouldMoveToNextTopic: false
      };
    }

    session.conversationDepth.answerCount += 1;
    session.conversationDepth.lastAnswerLength = answer.length;

    // Determine if answer is too brief (less than 50 characters) or needs elaboration
    const isBriefAnswer = answer.trim().length < 80; // Too short for a meaningful answer
    const answerCount = session.conversationDepth.answerCount;

    // Decide whether to ask follow-up or move to next topic
    // Ask follow-up if: answer is brief OR (first answer for this topic AND need depth)
    const shouldAskFollowUp = isBriefAnswer || (answerCount < 2);

    if (shouldAskFollowUp) {
      // Ask clarification/follow-up on the same topic
      console.log('Asking follow-up on same topic - depth building:', {
        answerCount,
        answerLength: answer.length,
        isBriefAnswer
      });

      let followUpQuestion;
      try {
        const llmService = new (await import('../services/llmService.js')).default;
        
        const messages = await interviewMessageService.getMessagesForSession(sessionId);
        const conversationContext = messages
          .filter(m => m.messageType === 'question' || m.messageType === 'answer')
          .slice(-4)
          .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
          .join('\n');

        // Generate a follow-up/elaboration question
        followUpQuestion = await llmService.generateFollowUpQuestion({
          role: session.role,
          difficulty: session.difficulty,
          skill: currentQuestion.competency || 'general',
          candidateAnswer: answer,
          conversationContext,
          questionNumber: session.currentQuestionIndex + 1,
          totalQuestions: session.interviewPlan.questions.length,
          isFollowUp: true  // Signal this is a follow-up, not a new topic
        });
      } catch (qErr) {
        console.warn('Follow-up generation failed, using fallback:', qErr.message);
        followUpQuestion = {
          text: isBriefAnswer 
            ? `Can you provide more details about what you mentioned? For example, what tools or approaches did you use?`
            : `That's interesting. Can you tell me more about how you handled that or what the outcome was?`,
          competency: currentQuestion.competency || 'General',
          difficulty: session.difficulty
        };
      }

      // Save follow-up question
      try {
        await interviewMessageService.saveMessage({
          sessionId,
          role: 'interviewer',
          content: followUpQuestion.text,
          messageType: 'follow-up',
          jobRole: session.role,
          difficulty: followUpQuestion.difficulty
        });
      } catch (msgErr) {
        console.error('Error saving follow-up question:', msgErr);
      }

      session.currentQuestion = {
        text: followUpQuestion.text,
        competency: followUpQuestion.competency,
        difficulty: followUpQuestion.difficulty,
        askedAt: new Date(),
        isFollowUp: true
      };

      await session.save();

      return res.json({
        success: true,
        interviewComplete: false,
        question: followUpQuestion.text,
        isFollowUp: true  // Signal to frontend this is a follow-up
      });
    }

    // Otherwise, move to next main question
    console.log('Moving to next topic - sufficient depth achieved:', {
      answerCount,
      answerLength: answer.length
    });

    // Plan-driven progression (no evaluation here)
    const plan = session.interviewPlan;
    if (!plan?.questions?.length) {
      return res.status(500).json({ success: false, error: 'Interview plan missing from session' });
    }

    const nextIndex = Number(session.currentQuestionIndex || 0) + 1;
    if (nextIndex >= plan.questions.length) {
      // Do NOT end the session here.
      // Single exit point: frontend should call `endInterview` to finalize + evaluate.
      return res.json({ success: true, interviewComplete: true });
    }

    // Reset conversation depth for new topic
    session.conversationDepth.answerCount = 0;
    session.conversationDepth.lastAnswerLength = 0;

    const nextSpec = plan.questions[nextIndex];
    
    // Debug logging
    console.log('submitAnswer - Generating next question:', {
      nextIndex,
      nextSpecSkill: nextSpec?.skill,
      nextSpecDifficulty: nextSpec?.difficulty,
      sessionRole: session.role,
      planLength: plan.questions.length,
      userAnswer: answer.substring(0, 100) + '...'
    });
    
    // Generate context-aware question based on user's answer
    let nextQuestion;
    try {
      const llmService = new (await import('../services/llmService.js')).default;
      
      // Build context from conversation so far
      const messages = await interviewMessageService.getMessagesForSession(sessionId);
      const conversationContext = messages
        .filter(m => m.messageType === 'question' || m.messageType === 'answer')
        .slice(-4) // Last 2 Q&A pairs for context
        .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n');

      // Use LLM to generate contextual follow-up question
      nextQuestion = await llmService.generateFollowUpQuestion({
        role: session.role,
        difficulty: nextSpec?.difficulty || session.difficulty,
        skill: nextSpec?.skill || 'general',
        candidateAnswer: answer,
        conversationContext,
        questionNumber: nextIndex + 1,
        totalQuestions: plan.questions.length
      });
    } catch (qErr) {
      console.error('Error generating question with LLM:', qErr);
      // Fallback to deterministic question if LLM fails
      console.log('Falling back to deterministic question generation');
      nextQuestion = generateDeterministicQuestion({
        skill: nextSpec?.skill || 'general',
        difficulty: nextSpec?.difficulty || session.difficulty,
        role: session.role,
        index: nextIndex
      });
    }

    // Debug logging
    console.log('Generated question:', nextQuestion);

    // Validate that we got a valid question
    if (!nextQuestion || !nextQuestion.text) {
      console.error('Failed to generate question:', { nextSpec, nextIndex, nextQuestion });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate next question' 
      });
    }

    session.currentQuestionIndex = nextIndex;
    session.currentQuestion = {
      text: nextQuestion.text,
      competency: nextQuestion.competency,
      difficulty: nextQuestion.difficulty,
      askedAt: new Date()
    };

    try {
      await interviewMessageService.saveMessage({
        sessionId,
        role: 'interviewer',
        content: nextQuestion.text,
        messageType: 'question',
        jobRole: session.role,
        difficulty: nextQuestion.difficulty
      });
    } catch (msgErr) {
      console.error('Error saving interviewer question message:', msgErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save question message: ' + msgErr.message 
      });
    }

    try {
      await session.save();
    } catch (saveErr) {
      console.error('Error saving session:', saveErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save session: ' + saveErr.message 
      });
    }

    return res.json({
      success: true,
      interviewComplete: false,
      question: nextQuestion.text
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
    const messages = await interviewMessageService.getMessagesForSession(sessionId);

    const transcript = buildTranscript(messages);
    const rubric = getRubricForRole(session.role);

    const evaluationAgent = new EvaluationAgent({
      transcript,
      rubric
    });

    const result = await evaluationAgent.run();

    // Persist into our Evaluation model shape (0-10 scale, includes overall)
    const scores10 = Object.fromEntries(
      Object.entries(result.scores || {}).map(([k, v]) => [k, Math.max(0, Math.min(10, Number(v || 0) * 2))])
    );
    const overall10 = Math.max(0, Math.min(10, Number(result.overallScore || 0) * 2));

    await evaluationService.saveEvaluation({
      sessionId,
      evaluator: 'AI',
      scores: { ...scores10, overall: overall10 },
      comments: result.notes
    });

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.json({
      success: true,
      evaluation: {
        overallScore: result.overallScore,
        confidenceLevel: result.confidenceLevel,
        scores: result.scores,
        notes: result.notes
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
