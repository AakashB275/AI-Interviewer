/**
 * EvaluationAgent
 * - Deterministic, heuristic evaluator
 * - NOT a semantic judge of competence
 * - Produces conservative signals, not verdicts
 */
export class EvaluationAgent {
  constructor({ transcript = '', rubric = {} } = {}) {
    this.transcript = String(transcript || '').toLowerCase();
    this.rubric = rubric || {};
  }

  run() {
    const scores = {};

    for (const skill of Object.keys(this.rubric)) {
      const { keywords = [], negativeKeywords = [] } = this.rubric[skill] || {};

      let positiveHits = 0;
      let negativeHits = 0;

      keywords.forEach(k => {
        if (this.transcript.includes(k.toLowerCase())) positiveHits++;
      });

      negativeKeywords.forEach(k => {
        if (this.transcript.includes(k.toLowerCase())) negativeHits++;
      });

      // Conservative heuristic scoring
      let score = 0;
      if (positiveHits > 0) score = Math.min(5, positiveHits);
      if (negativeHits > 0) score = Math.max(0, score - negativeHits);

      scores[skill] = score;
    }

    const values = Object.values(scores);
    const overall =
      values.length > 0
        ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
        : 0;

    return {
      type: 'HeuristicEvaluation',
      scores,
      overallScore: overall,
      // Conservative, bounded confidence to prevent misuse as "ground truth"
      confidenceLevel: values.length ? 0.35 : 0.3,
      notes:
        'Heuristic keyword-based signal, not semantic competence score. Scores indicate keyword-signal presence, not proficiency.'
    };
  }
}

export default EvaluationAgent;
