const express = require('express');
const router = express.Router();
const GuideProgress = require('../models/GuideProgress');
const { runAIWithPool } = require('../services/aiManager');

// Helper: call AI using centralized pool
const callAI = async (prompt) => {
    try {
        const responseText = await runAIWithPool(prompt, { jsonMode: true });
        // Strip markdown fences
        let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const s = cleaned.indexOf('{');
        const e = cleaned.lastIndexOf('}');
        if (s !== -1 && e !== -1) cleaned = cleaned.substring(s, e + 1);
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[Guide] AI Pool Failed:', e.message);
        throw new Error('AI services are currently busy across all channels. Please wait a minute.');
    }
};

// ── GET /api/guide/:userId ────────────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
    try {
        let progress = await GuideProgress.findOne({ userId: req.params.userId });
        if (!progress) {
            progress = new GuideProgress({ userId: req.params.userId, phases: {}, xp: 0 });
            await progress.save();
        }
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/guide/:userId ────────────────────────────────────────────────────
router.put('/:userId', async (req, res) => {
    try {
        const { phases, xp } = req.body;
        const updated = await GuideProgress.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: { phases, xp } },
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/guide/generate ──────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
    try {
        const { stage, context } = req.body;
        let prompt = '';

        // ── STEP 1: Select Domain → generate trending topics ──────────────────
        if (stage === 'select_domain') {
            prompt = `You are an expert research advisor. The user selected the research domain: "${context.domain}".

Generate exactly 5 trending research topics within this domain.
For each topic, include:
- "title": short, specific topic name (not generic, be precise)
- "description": 1-2 sentence description of what this topic covers
- "why_trending": 1 sentence explaining why it is trending right now (mention recent tech or event if possible)

Rank them by innovation potential (most innovative first).

Return ONLY this JSON object:
{
  "topics": [
    { "title": "...", "description": "...", "why_trending": "..." },
    ...
  ]
}`;

            // ── STEP 2: Trending Topics → generate literature summary ─────────────
        } else if (stage === 'trending_topics') {
            prompt = `You are an expert research analyst. Provide a detailed literature summary for the topic "${context.topic}" within the domain "${context.domain}".

Include:
1. "landscape": 2-3 sentences describing the current research landscape
2. "methodologies": array of 4-6 common methodologies/techniques used
3. "performance": 2 sentences about average reported performance metrics in literature
4. "cited_approaches": array of 4-5 most cited or well-known approaches (e.g., BERT, ResNet, etc.)
5. "limitations": array of 4-6 common limitations researchers have identified across studies

Return ONLY this JSON object:
{
  "landscape": "...",
  "methodologies": ["...", "..."],
  "performance": "...",
  "cited_approaches": ["...", "..."],
  "limitations": ["...", "..."]
}`;

            // ── STEP 3: Literature Summary → extract research gaps ────────────────
        } else if (stage === 'literature_summary') {
            prompt = `You are an expert research gap analyst. Based on this literature summary for the topic "${context.topic}" in domain "${context.domain}":

${context.literatureSummary}

Identify 5 structured research gaps. For each gap include:
- "title": short gap title (specific and actionable)
- "description": 2-3 sentences explaining why this is a gap
- "innovation_potential": string like "High", "Very High", "Medium-High"

Order by innovation potential (highest first). Area #1 should be the most promising for a hackathon / publication.

Return ONLY this JSON object:
{
  "gaps": [
    { "title": "...", "description": "...", "innovation_potential": "..." },
    ...
  ]
}`;

            // ── STEP 4: Research Gap → generate problem statement ─────────────────
        } else if (stage === 'research_gap') {
            const modeInstruction = context.mode === 'innovative'
                ? 'Make it especially innovative and forward-looking with novel angles.'
                : context.mode === 'ieee'
                    ? 'Write all versions in strict IEEE conference paper style.'
                    : context.mode === 'refine'
                        ? 'Refine and improve clarity, precision, and academic tone.'
                        : '';

            prompt = `You are an expert academic research mentor. The researcher is working in domain "${context.domain}" on topic "${context.topic}".
The identified research gap is: "${context.gap}".
${modeInstruction}

Generate a complete, publication-ready problem statement package:

1. "academic": Formal academic problem statement (3-4 sentences, passive voice, cite problem significance)
2. "technical": Technical problem statement (engineering-focused, mention algorithms/architecture)
3. "simple": Simple plain-language explanation (for non-experts, 2-3 sentences)
4. "objectives": Array of exactly 4 specific, measurable research objectives (start each with an action verb like "Develop", "Evaluate", "Propose")
5. "methodology_direction": 2-3 sentences suggesting the methodology direction to solve this problem

Return ONLY this JSON object:
{
  "academic": "...",
  "technical": "...",
  "simple": "...",
  "objectives": ["...", "...", "...", "..."],
  "methodology_direction": "..."
}`;

        } else {
            return res.status(400).json({ error: 'Invalid stage: ' + stage });
        }

        const data = await callAI(prompt);
        res.json(data);
    } catch (err) {
        console.error('Guide generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
