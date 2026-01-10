/**
 * InterviewPlannerAgent
 * - Side-effect free planner that produces a question plan based on resume analysis
 * - Constructor takes { resumeAnalysis, constraints }
 * - run() returns deterministic plan JSON
 */
export class InterviewPlannerAgent {
  constructor({ resumeAnalysis = {}, constraints = {} } = {}) {
    this.resume = resumeAnalysis || {};
    this.constraints = constraints || {};
  }

  async run() {
    const skills = this.resume.skills || [];
    const years = Number(this.resume.estimatedYearsExperience || 0);

    // Basic heuristic to pick question count and difficulty
    const questionCount = this.constraints.questionCount || (years >= 5 ? 8 : years >= 2 ? 5 : 3);
    const baseDifficulty = years >= 5 ? 'hard' : years >=2 ? 'medium' : 'easy';

    const plan = [];
    for (let i = 0; i < questionCount; i++) {
      const skill = skills[i % Math.max(1, skills.length)] || 'general';
      const difficulty = i === 0 ? 'warmup' : (i === questionCount -1 ? 'wrapup' : baseDifficulty);
      plan.push({ id: `q-${i+1}`, skill, difficulty, estimatedTimeSeconds: difficulty === 'hard' ? 120 : difficulty === 'medium' ? 90 : 60 });
    }

    return {
      type: 'InterviewPlan',
      questionCount: plan.length,
      questions: plan,
      constraints: this.constraints
    };
  }
}

export default InterviewPlannerAgent;
