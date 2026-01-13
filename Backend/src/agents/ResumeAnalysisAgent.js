/**
 * ResumeAnalysisAgent
 * - Side-effect free; no DB, no FS, no HTTP
 * - Constructor takes { text, metadata }
 * - run() returns structured JSON describing extracted facets
 */
export class ResumeAnalysisAgent {
  constructor({ text = '', metadata = {} } = {}) {
    this.text = String(text || '');
    this.metadata = metadata || {};
  }

  async run() {
    const t = this.text.toLowerCase();

    // Deterministic, simple heuristics (no LLM)
    const skills = [];
    const knownSkills = ['javascript','js','node','react','python','java','sql','mongodb','docker','aws','git'];
    knownSkills.forEach(s => { if (t.includes(s)) skills.push(s); });

    // Estimate years of experience from patterns like 'x years'
    let years = 0;
    const m = this.text.match(/(\d+)\s+years?/i);
    if (m) years = parseInt(m[1], 10) || 0;

    const summary = this.text.split('\n').slice(0,3).join(' ').slice(0,400);

    return {
      type: 'ResumeAnalysis',
      summary,
      skills: Array.from(new Set(skills)),
      estimatedYearsExperience: years,
      metadata: this.metadata
    };
  }
}

export default ResumeAnalysisAgent;
