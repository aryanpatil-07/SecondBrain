const { askLLM } = require('./aiService');

/**
 * Analyzes a note and returns a structured knowledge assessment.
 * Returns null on any failure so callers can continue without analysis.
 */
const analyzeNote = async (note) => {
  const text = (note.content || note.ocrText || '').trim();
  if (!text || text.length < 20) return null;

  const prompt = `You are an expert knowledge assessor. Analyze the following note written by a student/learner.

Note Title: ${note.title}
Note Tags: ${(note.tags || []).join(', ') || 'none'}
Note Content:
${text.slice(0, 3000)}

Your task:
1. Assess the depth and quality of understanding shown in this note.
2. Build a topic progression flowchart from beginner → intermediate → advanced for this subject area.
3. Identify which node best represents the writer's current understanding.

Return ONLY a valid JSON object with exactly this structure (no markdown, no explanation):
{
  "score": <integer 0-100 representing knowledge depth>,
  "level": <"beginner" | "intermediate" | "advanced" | "expert">,
  "summary": "<2-3 sentence assessment of what the writer understands and where they stand>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "currentNode": "<id of the node that matches current level, e.g. node_3>",
  "nodes": [
    { "id": "node_1", "label": "<beginner topic>", "level": "beginner", "isCurrent": false, "parents": [] },
    { "id": "node_2", "label": "<beginner topic>", "level": "beginner", "isCurrent": false, "parents": ["node_1"] },
    { "id": "node_3", "label": "<intermediate topic>", "level": "intermediate", "isCurrent": true, "parents": ["node_2"] },
    { "id": "node_4", "label": "<intermediate topic>", "level": "intermediate", "isCurrent": false, "parents": ["node_2"] },
    { "id": "node_5", "label": "<advanced topic>", "level": "advanced", "isCurrent": false, "parents": ["node_3", "node_4"] },
    { "id": "node_6", "label": "<advanced topic>", "level": "advanced", "isCurrent": false, "parents": ["node_5"] }
  ]
}

Rules:
- nodes array must have 5-8 nodes covering the full progression for this subject
- exactly one node must have "isCurrent": true — the one matching currentNode
- parents is an array of parent node ids (for DAG edges); root nodes have empty parents []
- score reflects vocabulary sophistication, conceptual depth, and coverage
- keep node labels short (2-5 words each)`;

  try {
    const raw = await askLLM(prompt);

    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required shape
    if (
      typeof parsed.score !== 'number' ||
      !parsed.level ||
      !parsed.summary ||
      !Array.isArray(parsed.nodes) ||
      parsed.nodes.length === 0
    ) {
      console.error('analyzeNote: invalid shape', parsed);
      return null;
    }

    // Ensure analyzedAt
    parsed.analyzedAt = new Date();
    return parsed;
  } catch (err) {
    console.error('analyzeNote failed:', err.message);
    return null;
  }
};

/**
 * Learning Diagnosis Engine - Analyzes all notes with the same tags
 * and provides a comprehensive learning roadmap with:
 * - What you know (covered topics)
 * - What you're missing (gaps)
 * - Learning prerequisite chains
 */
const analyzeLearningPath = async (notes, selectedTags = []) => {
  if (!notes || notes.length === 0) return null;

  // Filter notes by selected tags if provided
  let relevantNotes = notes;
  if (selectedTags.length > 0) {
    relevantNotes = notes.filter(n => 
      (n.tags || []).some(tag => selectedTags.includes(tag))
    );
  }

  if (relevantNotes.length === 0) return null;

  // Build combined context from all notes
  const notesContext = relevantNotes
    .map(n => `Title: ${n.title}\nContent: ${(n.content || n.ocrText || '').slice(0, 500)}`)
    .join('\n\n---\n\n');

  const subjectArea = selectedTags.length > 0 
    ? selectedTags.join(' & ') 
    : 'this subject area';

  const prompt = `You are an advanced learning diagnosis engine. Analyze the collection of notes below and create a comprehensive learning roadmap.

Subject Area: ${subjectArea}
Tags: ${selectedTags.join(', ') || 'multiple'}
Number of Notes: ${relevantNotes.length}

Notes Content:
${notesContext.slice(0, 4000)}

Your task:
1. Identify EXACTLY what topics the learner already understands (based on notes content)
2. Identify GAPS - important topics in this subject they likely haven't covered
3. Build a complete learning prerequisite chain showing how topics depend on each other
4. Provide actionable next steps

Return ONLY a valid JSON object with exactly this structure (no markdown, no explanation):
{
  "subject": "<subject area name>",
  "proficiencyLevel": "<beginner|intermediate|advanced|expert>",
  "overallScore": <0-100>,
  "summary": "<2-3 sentences about their overall learning status>",
  "covered": [
    {
      "topic": "<topic name>",
      "depth": "<shallow|moderate|deep>",
      "confidence": <0-100>,
      "evidence": "<brief reason from notes>"
    }
  ],
  "gaps": [
    {
      "topic": "<missing topic>",
      "importance": "<critical|high|medium|low>",
      "reason": "<why this matters for the subject>"
    }
  ],
  "prerequisiteChains": [
    {
      "path": ["<foundational topic>", "<intermediate>", "<advanced>"],
      "description": "<what this chain teaches>"
    }
  ],
  "roadmap": [
    {
      "phase": 1,
      "name": "<phase name>",
      "topics": ["<topic1>", "<topic2>"],
      "duration": "<suggested learning time>",
      "description": "<what to focus on>"
    }
  ],
  "nextSteps": [
    "<actionable step 1>",
    "<actionable step 2>",
    "<actionable step 3>"
  ],
  "recommendations": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "areasToFocus": ["<area 1>", "<area 2>"],
    "resources": ["<resource suggestion 1>", "<resource suggestion 2>"]
  }
}

Rules:
- Be specific and actionable
- covered array should have 3-6 items
- gaps array should have 3-8 items
- prerequisiteChains should have 2-4 chains
- roadmap should have 3-5 phases
- nextSteps should have 3 concrete recommendations
- Confidence and scores are 0-100 integers`;

  try {
    const raw = await askLLM(prompt);

    // Strip markdown
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required shape
    if (
      !parsed.subject ||
      !parsed.proficiencyLevel ||
      typeof parsed.overallScore !== 'number' ||
      !Array.isArray(parsed.covered) ||
      !Array.isArray(parsed.gaps) ||
      !Array.isArray(parsed.prerequisiteChains) ||
      !Array.isArray(parsed.roadmap) ||
      !Array.isArray(parsed.nextSteps)
    ) {
      console.error('analyzeLearningPath: invalid shape', parsed);
      return null;
    }

    parsed.analyzedAt = new Date();
    parsed.noteCount = relevantNotes.length;
    return parsed;
  } catch (err) {
    console.error('analyzeLearningPath failed:', err.message);
    return null;
  }
};

module.exports = { analyzeNote, analyzeLearningPath };
