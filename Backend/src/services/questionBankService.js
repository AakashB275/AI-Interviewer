import Question from '../models/questions.js';

/**
 * Question bank service: deterministic access to stored questions.
 * - getQuestions(filter): returns matching questions
 * - selectQuestions({ skills, count, difficulty }): picks questions matching skills/difficulty
 */
export async function getQuestions(filter = {}, limit = 50) {
	return Question.find(filter).limit(limit).lean();
}

export async function selectQuestions({ skills = [], count = 5, difficulty } = {}) {
	const q = { $and: [] };
	if (skills && skills.length) {
		q.$and.push({ tags: { $in: skills } });
	}
	if (difficulty) q.$and.push({ difficulty: difficulty });

	const filter = q.$and.length ? q : {};

	// Try to fetch matching questions
	let questions = await Question.find(filter).limit(count).lean();

	// If not enough, fallback to random questions
	if (!questions || questions.length < count) {
		const need = count - (questions ? questions.length : 0);
		const extra = await Question.aggregate([{ $sample: { size: need } }]);
		questions = (questions || []).concat(extra);
	}

	return questions.slice(0, count);
}

export default { getQuestions, selectQuestions };
