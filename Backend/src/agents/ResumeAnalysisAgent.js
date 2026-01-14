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
    // Expanded skill detection to cover more technologies and frameworks
    const skills = [];
    const knownSkills = [
      // Frontend
      'javascript','js','typescript','ts','react','vue','angular','html','css','webpack','tailwind',
      // Backend
      'node','nodejs','express','python','django','java','spring','c#','csharp','php','ruby','go','golang','rust',
      // Databases
      'sql','mysql','postgres','postgresql','mongodb','firebase','redis','cassandra','dynamodb',
      // Tools & Platforms
      'docker','kubernetes','aws','azure','gcp','git','jenkins','gitlab','github','docker-compose',
      // Other
      'rest','graphql','api','microservices','testing','jest','mocha','pytest','linux','bash'
    ];
    
    knownSkills.forEach(s => { 
      if (t.includes(s)) {
        // Avoid duplicates (e.g., 'js' and 'javascript', 'node' and 'nodejs')
        if (s === 'js' && skills.includes('javascript')) return;
        if (s === 'ts' && skills.includes('typescript')) return;
        if (s === 'nodejs' && skills.includes('node')) return;
        if (s === 'golang' && skills.includes('go')) return;
        if (s === 'csharp' && skills.includes('c#')) return;
        if (s === 'postgresql' && skills.includes('postgres')) return;
        
        skills.push(s);
      }
    });

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
      skillsDetected: Array.from(new Set(skills)).length,
      metadata: this.metadata
    };
  }
}

export default ResumeAnalysisAgent;
