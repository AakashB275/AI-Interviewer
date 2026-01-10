/**
 * EvaluationAgent
 * - Side-effect free evaluator that takes transcript and rubric and returns structured scores
 * - Constructor accepts { transcript, rubric }
 */
export class EvaluationAgent {
  constructor({ transcript = '', rubric = {} } = {}) {
    this.transcript = String(transcript || '');
    this.rubric = rubric || {};
  }

  async run() {
    const t = this.transcript.toLowerCase();

    // Deterministic scoring: simple keyword checks per rubric competencies
    const scores = {};
    Object.keys(this.rubric).forEach(key => {
      const keywords = Array.isArray(this.rubric[key].keywords) ? this.rubric[key].keywords : [];
      let matched = 0;
      keywords.forEach(k => { if (t.includes(k.toLowerCase())) matched++; });
      const score = keywords.length ? Math.round((matched / keywords.length) * 5) : 0;
      scores[key] = score;
    });

    // Overall: average of scores
    const vals = Object.values(scores);
    const overall = vals.length ? Math.round((vals.reduce((a,b)=>a+b,0) / vals.length) * 10) / 10 : 0;

    return {
      type: 'Evaluation',
      scores,
      overallScore: overall,
      notes: 'Deterministic agent output — designed for downstream human/LLM review.'
    };
  }
}

export default EvaluationAgent;
