import Evaluation from '../models/evaluation.js';

/**
 * Persistence and aggregation service for evaluations.
 * - Stores evaluation payloads and computes simple aggregates.
 * - Does NOT perform any LLM or subjective scoring logic.
 */
export async function saveEvaluation({ sessionId, evaluator = 'system', scores = {}, comments = '' } = {}) {
	if (!sessionId) throw new Error('sessionId is required');
	const ev = await Evaluation.create({ session: sessionId, evaluator, scores, comments });
	return ev.toObject();
}

export async function getEvaluationsForSession(sessionId) {
	if (!sessionId) throw new Error('sessionId is required');
	return Evaluation.find({ session: sessionId }).lean();
}

export async function computeAggregates(sessionId) {
	const evaluations = await getEvaluationsForSession(sessionId);
	if (!evaluations || evaluations.length === 0) return { count: 0, averages: {} };

	const totals = {};
	const count = evaluations.length;

	evaluations.forEach(ev => {
		const s = ev.scores || {};
		Object.keys(s).forEach(k => {
			totals[k] = (totals[k] || 0) + Number(s[k] || 0);
		});
	});

	const averages = {};
	Object.keys(totals).forEach(k => {
		averages[k] = totals[k] / count;
	});

	return { count, averages };
}

export default { saveEvaluation, getEvaluationsForSession, computeAggregates };
