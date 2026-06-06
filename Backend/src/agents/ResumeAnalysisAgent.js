const FALLBACK_SKILLS = [
  'javascript','typescript','react','vue','angular','html','css','webpack','tailwind',
  'node','express','python','django','java','spring','php','ruby','go','rust',
  'sql','mysql','postgres','mongodb','firebase','redis','cassandra','dynamodb',
  'docker','kubernetes','aws','azure','gcp','git','jenkins','gitlab',
  'rest','graphql','microservices','jest','mocha','pytest','linux','bash'
];

function buildSkillExtractionPrompt(resumeText) {
  return {
    systemPrompt: `You are a technical resume parser. 
Your job is to extract skills and information from resumes accurately.
Always respond with valid JSON only. No explanation, no markdown, just JSON.`,

    userPrompt: `Analyze this resume and extract the following information.

RESUME TEXT:
"""
${resumeText.slice(0, 4000)}
"""

Extract and return ONLY this JSON structure:
{
  "skills": [
    "skill1", "skill2", "skill3"
  ],
  "yearsOfExperience": <number or 0 if not found>,
  "summary": "<2-3 sentence professional summary>",
  "seniorityLevel": "<junior|mid|senior|lead>",
  "primaryDomain": "<frontend|backend|fullstack|data|devops|mobile|other>"
}

Rules for skills extraction:
- Include ALL technologies mentioned: frameworks, languages, tools, platforms, databases, cloud services
- Include NEW or NICHE technologies even if uncommon (e.g., Bun, Deno, Astro, SvelteKit, Tauri)
- Normalize names: "Node.js" → "nodejs", "React.js" → "react", "PostgreSQL" → "postgres"
- Include soft skills only if strongly emphasized (e.g., "team leadership", "system design")
- Do NOT include generic words like "software", "development", "experience"
- Return skills as lowercase strings
- Maximum 30 skills
- yearsOfExperience: extract from phrases like "5 years of experience", "since 2019" etc.`
  };
}

function extractSkillsFromKeywords(text) {
  const t = text.toLowerCase();
  const skills = [];

  FALLBACK_SKILLS.forEach(s => {
    if (t.includes(s)) {
      if (s === 'js'         && skills.includes('javascript'))  return;
      if (s === 'ts'         && skills.includes('typescript'))  return;
      if (s === 'nodejs'     && skills.includes('node'))        return;
      if (s === 'golang'     && skills.includes('go'))          return;
      if (s === 'postgresql' && skills.includes('postgres'))    return;
      skills.push(s);
    }
  });

  return [...new Set(skills)];
}

function extractYearsFromText(text) {
  const m = text.match(/(\d+)\s+years?/i);
  return m ? parseInt(m[1], 10) || 0 : 0;
}

// Main Agent 
export class ResumeAnalysisAgent {
  constructor({ text = '', metadata = {} } = {}) {
    this.text     = String(text || '');
    this.metadata = metadata || {};
  }

  async run() {
    try {
      const result = await this._extractWithLLM();
      console.log(`✅ Resume analysis via LLM — ${result.skills.length} skills detected`);
      return result;
    } catch (err) {
      console.warn(`⚠️  LLM resume analysis failed (${err.message}), falling back to keywords`);
      return this._extractWithKeywords();
    }
  }

  async _extractWithLLM() {
    const llmService = (await import('../services/llmService.js')).default;

    const { systemPrompt, userPrompt } = buildSkillExtractionPrompt(this.text);

    const raw = await llmService.extractResumeData({ systemPrompt, userPrompt });

    const parsed = this._parseJSON(raw);

    // Validate structure
    if (!parsed || !Array.isArray(parsed.skills)) {
      throw new Error('Invalid LLM response structure');
    }

    const skills = parsed.skills
      .map(s => String(s).toLowerCase().trim())
      .filter(s => s.length > 1 && s.length < 50) 
      .slice(0, 30);

    return {
      type:                     'ResumeAnalysis',
      summary:                  parsed.summary || this.text.slice(0, 400),
      skills:                   [...new Set(skills)],
      estimatedYearsExperience: Number(parsed.yearsOfExperience) || extractYearsFromText(this.text),
      skillsDetected:           skills.length,
      seniorityLevel:           parsed.seniorityLevel || 'mid',
      primaryDomain:            parsed.primaryDomain  || 'other',
      extractionMethod:         'llm',                
      metadata:                 this.metadata
    };
  }

  _extractWithKeywords() {
    const skills = extractSkillsFromKeywords(this.text);
    const years  = extractYearsFromText(this.text);
    const summary = this.text.split('\n').slice(0, 3).join(' ').slice(0, 400);

    return {
      type:                     'ResumeAnalysis',
      summary,
      skills,
      estimatedYearsExperience: years,
      skillsDetected:           skills.length,
      seniorityLevel:           years >= 5 ? 'senior' : years >= 2 ? 'mid' : 'junior',
      primaryDomain:            'other',
      extractionMethod:         'keywords',           
      metadata:                 this.metadata
    };
  }

  _parseJSON(text) {
    try {
      // Strip markdown code blocks if LLM wrapped it
      const clean = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found');

      return JSON.parse(match[0]);
    } catch (err) {
      throw new Error(`JSON parse failed: ${err.message}`);
    }
  }
}

export default ResumeAnalysisAgent;