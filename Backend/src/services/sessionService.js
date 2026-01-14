import InterviewSession from '../models/interviewSession.js';

/**
 * Thin session lifecycle manager.
 * - Only handles create/read/update/end for sessions.
 * - No planning or question-selection logic here.
 */
export async function createSession({ userId, metadata = {} } = {}) {
	if (!userId) throw new Error('userId is required');
	// This app's session model requires documentId/role/difficulty/interviewPlan.
	// Keep this helper explicit to avoid creating invalid sessions.
	const { documentId, role, difficulty, interviewPlan } = metadata || {};
	if (!documentId) throw new Error('documentId is required');
	if (!role) throw new Error('role is required');
	if (!difficulty) throw new Error('difficulty is required');
	if (!interviewPlan) throw new Error('interviewPlan is required');

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
	return session.toObject();
}

export async function getSession(sessionId) {
	if (!sessionId) throw new Error('sessionId is required');
	return InterviewSession.findById(sessionId).lean();
}

export async function getSessionByUser(userId) {
	if (!userId) throw new Error('userId is required');
	return InterviewSession.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function getAllSessions() {
	return InterviewSession.find({}).sort({ createdAt: -1 }).lean();
}

export async function updateSession(sessionId, updates = {}) {
	if (!sessionId) throw new Error('sessionId is required');
	updates.lastUpdated = new Date();
	return InterviewSession.findByIdAndUpdate(sessionId, updates, { new: true }).lean();
}

export async function endSession(sessionId) {
	if (!sessionId) throw new Error('sessionId is required');
	return InterviewSession.findByIdAndUpdate(sessionId, { status: 'ended', endedAt: new Date(), lastUpdated: new Date() }, { new: true }).lean();
}

export default { createSession, getSession, updateSession, endSession, getSessionByUser, getAllSessions };
