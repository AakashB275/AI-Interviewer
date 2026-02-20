import sessionService from '../services/sessionService.js';
import evaluationService from '../services/evaluationService.js';
import interviewMessageService from '../services/interviewMessageService.js';
import User from '../models/user.js';
import Evaluation from '../models/evaluation.js';

/**
 * Returns simple user-level analytics: total sessions and evaluation aggregates
 */
export async function getUserStats(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

		const sessions = await sessionService.getSessionByUser?.(userId) || [];
		const sessionCount = Array.isArray(sessions) ? sessions.length : 0;

		// compute aggregates across sessions' evaluations
		const sessionIds = sessions.map(s => s._id).filter(Boolean);
		const aggregates = { count: 0, averages: {} };
		if (sessionIds.length) {
			const perSession = await Promise.all(sessionIds.map(id => evaluationService.computeAggregates(id)));
			const totals = {};
			let validCount = 0;
			perSession.forEach(ps => {
				if (ps && ps.count) {
					validCount++;
					Object.entries(ps.averages || {}).forEach(([k,v]) => { totals[k] = (totals[k] || 0) + v; });
				}
			});
			const averages = {};
			Object.keys(totals).forEach(k => { averages[k] = validCount ? totals[k] / validCount : 0; });
			aggregates.count = validCount;
			aggregates.averages = averages;
		}

		// include most recent ended session details (evaluation + conversation)
		const recentEnded = sessions.find(s => s.status === 'ended') || sessions[0] || null;
		let recentSession = null;
		if (recentEnded) {
			const sessionId = recentEnded._id;
			const messages = await interviewMessageService.getMessagesForSession(sessionId).catch(() => []);
			const evaluations = await evaluationService.getEvaluationsForSession(sessionId).catch(() => []);
			const latestEval = evaluations && evaluations.length ? evaluations.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
			recentSession = {
				sessionId: String(sessionId),
				jobRole: recentEnded.role,
				difficulty: recentEnded.difficulty,
				startedAt: recentEnded.startedAt,
				endedAt: recentEnded.endedAt,
				conversationHistory: (messages || []).map(m => ({ role: m.role, content: m.content, type: m.messageType, timestamp: m.createdAt })),
				evaluation: latestEval ? {
					overallScore: latestEval.scores?.overall,
					scores: latestEval.scores,
					comments: latestEval.comments
				} : null
			};
		}

		return res.json({ success: true, sessionCount, aggregates, recentSession });
	} catch (err) {
		console.error('analytics error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function getPlatformStats(req, res) {
	try {
		// platform stats: total users, sessions, evaluations, and aggregate scores
		const allSessions = await sessionService.getAllSessions?.() || [];
		const totalSessions = Array.isArray(allSessions) ? allSessions.length : 0;

		const totalUsers = await User.countDocuments();

		const totalEvaluations = await Evaluation.countDocuments();

		// Compute aggregate averages across all evaluations
		const evaluations = await Evaluation.find({}).lean();
		const totals = {};
		let evalCount = 0;
		evaluations.forEach(ev => {
			const s = ev.scores || {};
			const keys = Object.keys(s);
			if (keys.length) {
				evalCount += 1;
				keys.forEach(k => { totals[k] = (totals[k] || 0) + Number(s[k] || 0); });
			}
		});

		const averages = {};
		Object.keys(totals).forEach(k => { averages[k] = evalCount ? (totals[k] / evalCount) : 0; });

		return res.json({ success: true, totalUsers, totalSessions, totalEvaluations, aggregates: { count: evalCount, averages } });
	} catch (err) {
		console.error('platform stats error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export default { getUserStats, getPlatformStats };
