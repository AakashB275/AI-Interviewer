/**
 * InterviewPlannerAgent
 * - Deterministic interview planner
 * - Focuses on depth over coverage
 * - Explicitly handles unknown skills
 */
export class InterviewPlannerAgent {
  constructor({ resumeAnalysis = {}, constraints = {} } = {}) {
    this.resume = resumeAnalysis || {};
    this.constraints = constraints || {};
  }

  run() {
    const skills = Array.isArray(this.resume.skills) ? this.resume.skills : [];
    const years = Number(this.resume.estimatedYearsExperience || 0);

    const questionCount =
      this.constraints.questionCount ??
      (years >= 5 ? 7 : years >= 2 ? 5 : 3);

    const baseDifficulty =
      years >= 5 ? 'hard' : years >= 2 ? 'medium' : 'easy';

    // Prioritize first half of skills as "core"
    const coreSkills =
      skills.length > 0
        ? skills.slice(0, Math.ceil(skills.length / 2))
        : ['general'];

    const plan = [];

    for (let i = 0; i < questionCount; i++) {
      let skill;

      if (i === 0) {
        skill = 'general'; // warmup
      } else if (i === questionCount - 1) {
        skill = 'general'; // wrap-up
      } else {
        skill = coreSkills[(i - 1) % coreSkills.length];
      }

      const difficulty =
        i === 0
          ? 'warmup'
          : i === questionCount - 1
          ? 'wrapup'
          : baseDifficulty;

      plan.push({
        id: `q-${i + 1}`,
        skill,
        difficulty,
        estimatedTimeSeconds:
          difficulty === 'hard'
            ? 120
            : difficulty === 'medium'
            ? 90
            : 60
      });
    }

    return {
      type: 'InterviewPlan',
      intent: 'Depth-first deterministic interview',
      questionCount: plan.length,
      questions: plan,
      constraints: this.constraints
    };
  }
}

export default InterviewPlannerAgent;
