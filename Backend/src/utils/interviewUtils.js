/**
 * Build a plain-text transcript from persisted InterviewMessage documents.
 * Supports both legacy `message` and canonical `content`.
 */
export function buildTranscript(messages = []) {
  return (messages || [])
    .map(m => {
      const role = m?.role || 'unknown';
      const text = m?.content ?? m?.message ?? '';
      return `${role}: ${String(text)}`;
    })
    .join('\n');
}

/**
 * Very small heuristic rubric (keyword signals), used by the deterministic EvaluationAgent.
 * Keep this explicit and conservative—this is NOT a semantic competence evaluator.
 */
export function getRubricForRole(role = '') {
  const base = {
    communication: { keywords: ['explain', 'clarify', 'example', 'context'] },
    problemSolving: { keywords: ['approach', 'steps', 'logic', 'tradeoff'] },
    technicalDepth: { keywords: ['performance', 'scalability', 'latency', 'throughput'] }
  };

  const r = String(role || '').toLowerCase();

  // Slightly bias rubric based on role keywords (still deterministic).
  if (r.includes('frontend') || r.includes('react') || r.includes('ui')) {
    return {
      ...base,
      technicalDepth: { keywords: [...base.technicalDepth.keywords, 'accessibility', 'render', 'bundle'] }
    };
  }
  if (r.includes('backend') || r.includes('api') || r.includes('server')) {
    return {
      ...base,
      technicalDepth: { keywords: [...base.technicalDepth.keywords, 'database', 'cache', 'queue', 'consistency'] }
    };
  }
  if (r.includes('data') || r.includes('ml') || r.includes('machine learning')) {
    return {
      ...base,
      technicalDepth: { keywords: [...base.technicalDepth.keywords, 'dataset', 'model', 'bias', 'overfitting'] }
    };
  }

  return base;
}

/**
 * Planner emits warmup/wrapup; llmService expects easy/medium/hard.
 */
export function normalizePlanDifficulty(planDifficulty, fallback = 'medium') {
  const d = String(planDifficulty || '').toLowerCase();
  if (d === 'warmup' || d === 'wrapup') return 'easy';
  if (d === 'easy' || d === 'medium' || d === 'hard') return d;
  return fallback;
}

/**
 * Deterministic question generator based on plan spec (skill + difficulty).
 * No LLM decisions - purely index-based progression.
 * 
 * @param {Object} params
 * @param {string} params.skill - Skill from plan (e.g., 'JavaScript', 'general')
 * @param {string} params.difficulty - Difficulty from plan ('easy', 'medium', 'hard', 'warmup', 'wrapup')
 * @param {string} params.role - Job role for context
 * @param {number} params.index - Question index (for deterministic variation)
 * @returns {Object} Question object with text and competency
 */
export function generateDeterministicQuestion({ skill = 'general', difficulty = 'medium', role = '', index = 0 } = {}) {
  const normalizedDiff = normalizePlanDifficulty(difficulty, 'medium');
  const skillLower = String(skill || 'general').toLowerCase();
  const roleLower = String(role || '').toLowerCase();
  
  // Deterministic question templates based on skill + difficulty
  const templates = {
    general: {
      warmup: [
        `Tell me about yourself and why you're interested in this ${role || 'position'}.`,
        `Walk me through your background and what led you to apply for this role.`,
        `Give me an overview of your experience and what excites you about ${role || 'this position'}.`
      ],
      easy: [
        `Describe a project you've worked on that you're proud of.`,
        `Tell me about a challenge you faced in a recent project and how you overcame it.`,
        `What's your approach to learning new technologies?`
      ],
      medium: [
        `Describe a time when you had to make a technical decision with trade-offs. How did you evaluate the options?`,
        `Tell me about a project where you had to collaborate with others. What was your role and what challenges did you face?`,
        `Describe a situation where you had to debug a complex issue. Walk me through your process.`
      ],
      hard: [
        `Describe a system or architecture you designed or significantly contributed to. What were the key design decisions and why?`,
        `Tell me about a time you had to optimize performance at scale. What was the problem and how did you solve it?`,
        `Describe a technical challenge that required you to learn something completely new. How did you approach it?`
      ],
      wrapup: [
        `Do you have any questions for me about the role or the team?`,
        `Is there anything else you'd like to share about your experience or interests?`,
        `What are you most excited about in your next role?`
      ]
    }
  };

  // Skill-specific templates (deterministic based on skill name)
  const skillTemplates = {
    javascript: {
      easy: [
        `Explain the difference between let, const, and var in JavaScript.`,
        `What are closures in JavaScript? Can you give an example?`,
        `How does the event loop work in JavaScript?`
      ],
      medium: [
        `Explain how prototypal inheritance works in JavaScript. How is it different from classical inheritance?`,
        `Describe how you would implement a debounce or throttle function.`,
        `How do you handle asynchronous operations in JavaScript? Compare promises and async/await.`
      ],
      hard: [
        `Explain the JavaScript memory model. How does garbage collection work?`,
        `Describe how you would implement a custom state management solution. What are the trade-offs?`,
        `How would you optimize a React application that's experiencing performance issues?`
      ]
    },
    react: {
      easy: [
        `What is React and what problem does it solve?`,
        `Explain the difference between props and state.`,
        `What are React hooks? Give an example of when you'd use useState.`
      ],
      medium: [
        `Explain the React component lifecycle. How do useEffect dependencies work?`,
        `Describe how you would handle state management in a large React application.`,
        `What are the differences between controlled and uncontrolled components?`
      ],
      hard: [
        `Explain React's reconciliation algorithm. How does React decide what to re-render?`,
        `Describe how you would implement server-side rendering with React. What are the challenges?`,
        `How would you optimize a React application for performance? Discuss memoization strategies.`
      ]
    },
    nodejs: {
      easy: [
        `What is Node.js and what makes it different from traditional server-side languages?`,
        `Explain the difference between require and import in Node.js.`,
        `How do you handle errors in Node.js applications?`
      ],
      medium: [
        `Describe how the Node.js event loop handles I/O operations.`,
        `How would you structure a Node.js application for scalability?`,
        `Explain the difference between streams and buffers in Node.js.`
      ],
      hard: [
        `Describe how you would implement a high-performance API in Node.js. What are the bottlenecks?`,
        `How would you handle memory leaks in a long-running Node.js process?`,
        `Explain how you would implement clustering in Node.js. What are the trade-offs?`
      ]
    },
    python: {
      easy: [
        `Explain the difference between lists and tuples in Python.`,
        `What are decorators in Python? Give an example.`,
        `How does Python handle memory management?`
      ],
      medium: [
        `Explain the Global Interpreter Lock (GIL) in Python. How does it affect concurrency?`,
        `Describe how you would implement a REST API using Python.`,
        `What are generators in Python? When would you use them instead of lists?`
      ],
      hard: [
        `How would you optimize a Python application for performance?`,
        `Describe how you would implement async/await patterns in Python.`,
        `Explain how you would handle large-scale data processing in Python.`
      ]
    },
    'system design': {
      easy: [
        `What factors would you consider when designing a URL shortener?`,
        `Describe the basic components of a web application architecture.`,
        `What is load balancing and why is it important?`
      ],
      medium: [
        `Design a chat application that supports real-time messaging. What are the key components?`,
        `How would you design a distributed caching system?`,
        `Describe how you would scale a database that's experiencing performance issues.`
      ],
      hard: [
        `Design a system that can handle millions of requests per second. What are the key architectural decisions?`,
        `How would you design a distributed system that maintains consistency across multiple data centers?`,
        `Design a recommendation system. How would you handle cold start problems?`
      ]
    }
  };

  // Select template based on skill
  let questionSet = templates.general[normalizedDiff] || templates.general.medium;
  
  if (skillLower !== 'general') {
    // Try to find skill-specific template
    const skillKey = Object.keys(skillTemplates).find(k => skillLower.includes(k));
    if (skillKey && skillTemplates[skillKey] && skillTemplates[skillKey][normalizedDiff]) {
      questionSet = skillTemplates[skillKey][normalizedDiff];
    }
  }

  // Ensure questionSet is valid
  if (!Array.isArray(questionSet) || questionSet.length === 0) {
    console.error('Invalid questionSet:', { skill, normalizedDiff, skillLower, questionSet });
    questionSet = templates.general.medium; // Fallback to medium difficulty general questions
  }

  // Deterministic selection based on index
  const questionText = questionSet[index % questionSet.length];
  
  // Use skill as competency (capitalize first letter)
  const competency = skill === 'general' 
    ? 'General' 
    : skill.charAt(0).toUpperCase() + skill.slice(1);

  return {
    text: questionText,
    competency,
    difficulty: normalizedDiff
  };
}

