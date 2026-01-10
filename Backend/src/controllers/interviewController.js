import sessionService from '../services/sessionService.js';
import questionBankService from '../services/questionBankService.js';
import messageService from '../services/interviewMessageService.js';
import ResumeAnalysisAgent from '../agents/ResumeAnalysisAgent.js';
import InterviewPlannerAgent from '../agents/InterviewPlannerAgent.js';

/**
 * Start interview: create session, produce plan via agent, select questions via service, persist session metadata
 */
export async function startInterview(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

		const { resumeText, constraints = {} } = req.body || {};

		// Create session record
		const session = await sessionService.createSession({ userId, metadata: { source: 'api' } });

		// Analyze resume via agent (agent is side-effect free)
		const resumeAgent = new ResumeAnalysisAgent({ text: resumeText || '', metadata: { userId } });
		const resumeAnalysis = await resumeAgent.run();

		// Plan interview via agent
		const planner = new InterviewPlannerAgent({ resumeAnalysis, constraints });
		const plan = await planner.run();

		// Select concrete questions via question bank service
		const skills = resumeAnalysis.skills || [];
		const questions = await questionBankService.selectQuestions({ skills, count: plan.questionCount, difficulty: undefined });

		// Persist plan into session metadata
		const updated = await sessionService.updateSession(session._id, { metadata: { plan, questionIds: questions.map(q=>q._id), currentIndex: 0 } });

		return res.json({ success: true, session: updated, questions });
	} catch (err) {
		console.error('startInterview error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function getUserSessions(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

		const sessions = await sessionService.getSessionByUser?.(userId) || [];
		return res.json({ success: true, sessions });
	} catch (err) {
		console.error('getUserSessions error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function nextQuestion(req, res) {
	try {
		const userId = req.user && req.user._id;
		const { sessionId } = req.body || {};
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
		if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' });

		const session = await sessionService.getSession(sessionId);
		if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

		const meta = session.metadata || {};
		const current = Number(meta.currentIndex || 0);
		const questionIds = meta.questionIds || [];
		if (current >= questionIds.length) return res.status(200).json({ success: true, message: 'No more questions' });

		const qId = questionIds[current];
		const questions = await questionBankService.getQuestions({ _id: qId });
		const question = questions && questions[0];

		// advance index
		await sessionService.updateSession(sessionId, { metadata: { ...meta, currentIndex: current + 1 } });

		return res.json({ success: true, question });
	} catch (err) {
		console.error('nextQuestion error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function submitAnswer(req, res) {
	try {
		const userId = req.user && req.user._id;
		const { sessionId, questionId, answer } = req.body || {};
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
		if (!sessionId || !questionId || !answer) return res.status(400).json({ success: false, error: 'sessionId, questionId and answer are required' });

		// Persist candidate answer as message
		const saved = await messageService.saveMessage({ sessionId, role: 'candidate', message: JSON.stringify({ questionId, answer }) });

		return res.json({ success: true, saved });
	} catch (err) {
		console.error('submitAnswer error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function endInterview(req, res) {
	try {
		const userId = req.user && req.user._id;
		const { sessionId } = req.body || {};
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
		if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' });

		const ended = await sessionService.endSession(sessionId);
		return res.json({ success: true, session: ended });
	} catch (err) {
		console.error('endInterview error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export default { startInterview, nextQuestion, submitAnswer, endInterview, getUserSessions };
