import sessionService from '../services/sessionService.js';
import evaluationService from '../services/evaluationService.js';

/**
 * Returns simple user-level analytics: total sessions and evaluation aggregates
 */
export async function getUserStats(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

		const sessions = await sessionService.getSessionByUser?.(userId) || [];
		// if service doesn't implement getSessionByUser, fallback to counting via find
		const sessionCount = Array.isArray(sessions) ? sessions.length : 0;

		// compute aggregates across sessions' evaluations
		const sessionIds = sessions.map(s => s._id).filter(Boolean);
		const aggregates = { count: 0, averages: {} };
		if (sessionIds.length) {
			// merge evaluations across sessions
			const perSession = await Promise.all(sessionIds.map(id => evaluationService.computeAggregates(id)));
			// simple merge: average each metric across sessions
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

		return res.json({ success: true, sessionCount, aggregates });
	} catch (err) {
		console.error('analytics error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function getPlatformStats(req, res) {
	try {
		// minimal platform stats: total sessions and evaluations
		const allSessions = await sessionService.getAllSessions?.() || [];
		const sessionCount = Array.isArray(allSessions) ? allSessions.length : 0;
		// evaluations count
		// If evaluationService has getEvaluationsForSession, we could aggregate; for now return sessionCount
		return res.json({ success: true, sessionCount });
	} catch (err) {
		console.error('platform stats error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export default { getUserStats, getPlatformStats };
