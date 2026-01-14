/**
 * InterviewPlannerAgent
 * - Deterministic interview planner
 * - Focuses on depth over coverage
 * - Explicitly handles unknown skills
 * - Asks meaningful number of questions based on skills, not just experience
 */
export class InterviewPlannerAgent {
  constructor({ resumeAnalysis = {}, constraints = {} } = {}) {
    this.resume = resumeAnalysis || {};
    this.constraints = constraints || {};
  }

  run() {
    const skills = Array.isArray(this.resume.skills) ? this.resume.skills : [];
    const years = Number(this.resume.estimatedYearsExperience || 0);

    // Calculate question count based on skills + experience
    // Minimum 5 questions (warmup + 3 skill-based + wrapup) regardless of experience
    // Add more if candidate has multiple skills
    let questionCount = this.constraints.questionCount;
    
    if (!questionCount) {
      // Base: 1 warmup + 3 core skill questions + 1 wrapup = 5 minimum
      const baseQuestions = 5;
      // Add 1 extra question for each additional skill detected
      const skillBonus = Math.min(skills.length - 1, 2); // Cap at +2 for max 7 questions
      questionCount = baseQuestions + skillBonus;
    }

    const baseDifficulty =
      years >= 5 ? 'hard' : years >= 2 ? 'medium' : 'easy';

    // Prioritize first half of skills as "core" 
    // If no skills detected, use 'general' for skill-based questions
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
        // Distribute core skills across the middle questions
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
      intent: 'Depth-first deterministic interview - skill-based',
      questionCount: plan.length,
      questions: plan,
      yearsOfExperience: years,
      detectedSkills: skills,
      baseDifficulty: baseDifficulty,
      constraints: this.constraints
    };
  }
}

export default InterviewPlannerAgent;
