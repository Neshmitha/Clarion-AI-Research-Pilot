const express = require('express');
const router = express.Router();
const axios = require('axios');
const ResearchBuild = require('../models/ResearchBuild');
const { runAIWithPool } = require('../services/aiManager');

// ── AI helper (using centralized pool) ───────────────────────────────────
const callAI = async (prompt) => {
    try {
        const text = await runAIWithPool(prompt, { jsonMode: true });
        return parseAIResponse(text);
    } catch (e) {
        console.error("[ResearchBuilder] AI Pool Failed:", e.message);
        throw new Error("AI services are currently busy across all channels. Please wait a minute.");
    }
};

const parseAIResponse = (text) => {
    try {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
        const jsonStr = (s !== -1 && e !== -1) ? cleaned.slice(s, e + 1) : cleaned;
        return JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("JSON Parse Error. Raw AI Response:\n", text);
        throw new Error("The AI returned a malformed response. Please try again.");
    }
};

// ── GET all builds for a user ──────────────────────────────────────────────
router.get('/builds/:userId', async (req, res) => {
    try {
        const builds = await ResearchBuild.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
        res.json(builds);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single build ───────────────────────────────────────────────────────
router.get('/build/:buildId', async (req, res) => {
    try {
        const build = await ResearchBuild.findById(req.params.buildId);
        if (!build) return res.status(404).json({ error: 'Not found' });
        res.json(build);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create new build ──────────────────────────────────────────────────
router.post('/build', async (req, res) => {
    try {
        const { userId } = req.body;
        const build = new ResearchBuild({ userId });
        await build.save();
        res.json(build);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT update build (any stage) ──────────────────────────────────────────
router.put('/build/:buildId', async (req, res) => {
    try {
        const build = await ResearchBuild.findByIdAndUpdate(
            req.params.buildId,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        res.json(build);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE build ───────────────────────────────────────────────────────────
router.delete('/build/:buildId', async (req, res) => {
    try {
        await ResearchBuild.findByIdAndDelete(req.params.buildId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET arXiv papers by domain ─────────────────────────────────────────────
router.get('/arxiv/:domain', async (req, res) => {
    try {
        const domain = req.params.domain;
        const query = encodeURIComponent(domain);
        const url = `http://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`;
        const response = await axios.get(url, { timeout: 10000 });
        const xml = response.data;

        // Simple XML parse
        const entries = xml.split('<entry>').slice(1);
        const papers = entries.map(entry => {
            const get = (tag) => {
                const m = entry.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'));
                return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
            };
            const getAll = (tag) => {
                const matches = [...entry.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gs'))];
                return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim());
            };
            const id = get('id');
            return {
                id,
                title: get('title').replace(/\s+/g, ' '),
                abstract: get('summary').replace(/\s+/g, ' ').slice(0, 300) + '...',
                authors: getAll('name').slice(0, 3).join(', '),
                published: get('published').slice(0, 10),
                link: id,
            };
        }).filter(p => p.title);

        res.json(papers);
    } catch (err) {
        console.error('arXiv fetch error:', err.message);
        res.json([]);
    }
});

// ── POST generate problem statements ──────────────────────────────────────
router.post('/generate/problems', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) {
            console.error("Missing domain for problems generation");
            return res.status(400).json({ error: "No research domain provided." });
        }
        const prompt = `You are a research advisor. For the domain "${domain}", generate 5 compelling research problem statements.
For each problem, include:
- "title": Short problem title
- "description": 2-3 sentence full description
- "background": 1-2 sentences of context
- "relatedWorks": ["ref1", "ref2", "ref3"] (3 real or plausible paper references)
- "objectives": ["obj1", "obj2", "obj3"] (3 clear research objectives)

Return ONLY this JSON:
{
  "problems": [
    { "title": "...", "description": "...", "background": "...", "relatedWorks": [...], "objectives": [...] }
  ]
}`;
        const data = await callAI(prompt);
        res.json(data);
    } catch (err) {
        console.error("Generate Problems Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST generate methodologies ────────────────────────────────────────────
router.post('/generate/methodologies', async (req, res) => {
    try {
        const { domain, problem } = req.body;
        if (!domain || !problem) {
            console.error("Missing params for methodologies:", { domain, problem });
            return res.status(400).json({ error: "Missing required parameters (domain or problem)." });
        }
        const prompt = `You are a research methods expert. For the research problem "${problem}" in domain "${domain}", suggest 4 methodologies.
For each methodology, include:
- "name": Methodology name
- "description": 2 sentence overview
- "advantages": ["adv1", "adv2"]
- "limitations": ["lim1", "lim2"]
- "tools": ["tool1", "tool2", "tool3"]

Return ONLY this JSON:
{
  "methodologies": [
    { "name": "...", "description": "...", "advantages": [...], "limitations": [...], "tools": [...] }
  ]
}`;
        const data = await callAI(prompt);
        res.json(data);
    } catch (err) {
        console.error("Generate Methodologies Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST generate experiment design ───────────────────────────────────────
router.post('/generate/experiments', async (req, res) => {
    try {
        const { domain, problem, methodology } = req.body;
        if (!domain || !problem || !methodology) {
            console.error("Missing params for experiments:", { domain, problem, methodology });
            return res.status(400).json({ error: "Missing required parameters (domain, problem, or methodology)." });
        }
        const prompt = `You are a research experiment designer. For the problem "${problem}" using "${methodology}" in domain "${domain}", suggest experiment configurations.
Return ONLY this JSON:
{
  "datasets": [
    { "name": "...", "description": "...", "size": "..." }
  ],
  "tools": ["tool1", "tool2", "tool3"],
  "metrics": [
    { "name": "...", "description": "..." }
  ],
  "baselines": [
    { "name": "...", "description": "..." }
  ]
}`;
        const data = await callAI(prompt);
        res.json(data);
    } catch (err) {
        console.error("Generate Experiments Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST generate research gaps ────────────────────────────────────────────
router.post('/generate/gaps', async (req, res) => {
    try {
        const { domain, problem, methodology, experiments } = req.body;
        const prompt = `You are a research gap analyst. Based on:
- Domain: "${domain}"
- Problem: "${problem}"
- Methodology: "${methodology}"
- Experiments: "${JSON.stringify(experiments)}"

Identify 4 specific research gaps. For each:
- "title": Short gap title
- "description": 2 sentence description of the gap
- "novelty": Why filling this gap would be novel
- "impact": Expected impact if resolved

Return ONLY this JSON:
{
  "gaps": [
    { "title": "...", "description": "...", "novelty": "...", "impact": "..." }
  ]
}`;
        const data = await callAI(prompt);
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST calculate research score ──────────────────────────────────────────
router.post('/generate/score', async (req, res) => {
    try {
        const { domain, problem, methodology, experiments, gap } = req.body;
        const prompt = `You are a research strength evaluator. Score this research plan:
- Domain: "${domain}"
- Problem: "${problem}"
- Methodology: "${methodology}"
- Gap: "${gap}"

Score from 0-100 on 4 dimensions. Return ONLY this JSON:
{
  "novelty":       { "score": 85, "reason": "..." },
  "feasibility":   { "score": 78, "reason": "..." },
  "impact":        { "score": 82, "reason": "..." },
  "technicalDepth":{ "score": 80, "reason": "..." },
  "overall": 81,
  "summary": "One sentence overall assessment."
}`;
        const data = await callAI(prompt);
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
