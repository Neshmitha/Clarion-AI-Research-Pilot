const axios = require('axios');
const Paper = require('../models/Paper');
const { runAIWithPool } = require('../services/aiManager');

/**
 * Calculate the impact score for a paper using AI and citation data.
 */
exports.calculateImpact = async (req, res) => {
    try {
        const { paperId } = req.params;
        const paper = await Paper.findById(paperId);

        if (!paper) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        let citationCount = paper.citations || 0;
        let publicationYear = paper.year;
        let venue = 'Unknown Venue';

        // 1. Try to fetch real citation data from Semantic Scholar
        if (paper.title && paper.source !== 'written' && paper.source !== 'draft') {
            try {
                const searchRes = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(paper.title)}&limit=1&fields=citationCount,year,venue`);
                if (searchRes.data && searchRes.data.data && searchRes.data.data.length > 0) {
                    const info = searchRes.data.data[0];
                    citationCount = info.citationCount || 0;
                    publicationYear = info.year || publicationYear;
                    venue = info.venue || 'Unknown Venue';
                }
            } catch (apiError) {
                console.warn('Semantic Scholar API error:', apiError.message);
            }
        }

        // 2. Prepare the AI Prompt
        const paperTitle = paper.title || paper.originalName || 'Untitled Research';
        const isDraft = paper.source === 'written' || paper.source === 'draft' || citationCount === 0;

        // Extract a snippet for AI if abstract is missing but content exists
        let abstractSnippet = paper.abstract;
        if (!abstractSnippet && paper.content) {
            // Strip HTML tags for the prompt
            abstractSnippet = paper.content.replace(/<[^>]*>?/gm, '').slice(0, 1500);
            if (paper.content.length > 1500) abstractSnippet += '...';
        }

        const prompt = `You are a research evaluation expert. 
Evaluate the following research paper manuscript. ${isDraft ? 'This is a draft/manuscript, judge its POTENTIAL and SCHOLARLY QUALITY.' : 'This is a published work.'}

PAPER DETAILS:
Title: ${paperTitle}
Abstract/Content Summary: ${abstractSnippet || 'No abstract or content provided.'}
Year: ${publicationYear || (isDraft ? '2026 (Draft)' : 'N/A')}
Venue: ${venue === 'Unknown Venue' ? (isDraft ? 'Pending Submission' : 'N/A') : venue}
Citations: ${citationCount}

EVALUATION CRITERIA (Total 100 points):
1. Citation & Influence Potential (30 pts): Score based on the importance and scale of the research problem.
2. Venue/Context Quality (10 pts): Suitability for a high-impact journal or conference.
3. Novelty and Originality (20 pts)
4. Methodological & Technical Strength (20 pts)
5. Practical Relevance (10 pts)
6. Structural Clarity & Reproducibility (10 pts)

INSTRUCTIONS:
- Return a score out of 100.
- Be critical but fair to unpublished drafts.
- Use EXACTLY this format:

Impact Score: XX/100

Breakdown:
- Citation & Influence: X/30
- Venue Quality: X/10
- Novelty: X/20
- Methodology: X/20
- Practical Relevance: X/10
- Structural Clarity: X/10

Justification:
(Concise 2-3 sentence explanation)`;

        let responseText = "";

        try {
            console.log('[AI POOL] Sending impact evaluation request...');
            responseText = await runAIWithPool(prompt);
            console.log('[AI POOL] Impact analysis response received successfully.');
        } catch (poolErr) {
            console.error('[AI POOL] Impact Calculation Failed:', poolErr.message);
            throw new Error('AI services are currently busy across all channels. Please wait a minute.');
        }

        let finalScore = 0;
        const scoreMatches = responseText.match(/Impact\s*Score\D*([\d.]+)/i);
        if (scoreMatches) finalScore = parseFloat(scoreMatches[1]);

        // Extract breakdown lines - more robust matching
        const breakdown = {};
        const lines = responseText.split('\n');
        lines.forEach(line => {
            const match = line.match(/([^:*#-]+):\s*([\d.]+)\/(\d+)/);
            if (match) {
                const label = match[1].replace(/\*/g, '').trim();
                const score = match[2];
                const total = match[3];
                if (label.length < 50 && label.toLowerCase() !== 'impact score') {
                    breakdown[label] = `${score}/${total}`;
                }
            }
        });

        // Extract justification - look for everything after 'Justification:'
        let justification = "Evaluation complete.";
        const justMatch = responseText.match(/Justification:\s*([\s\S]*)/i);
        if (justMatch) justification = justMatch[1].trim();

        // 4. Update and Save - ENSURE YEAR IS SAVED
        paper.impactScore = finalScore;
        paper.impactBreakdown = breakdown;
        paper.impactJustification = justification;
        paper.citations = citationCount;

        if (publicationYear) {
            paper.year = publicationYear;
        } else if (!paper.year) {
            paper.year = 2026;
        }

        console.log(`Saving paper with Score: ${finalScore}, Year: ${paper.year}, Citations: ${paper.citations}`);
        await paper.save();

        res.json({
            success: true,
            impactScore: finalScore,
            breakdown,
            justification,
            citations: paper.citations,
            year: paper.year
        });

    } catch (err) {
        console.error('CRITICAL IMPACT ERROR:', err);
        res.status(500).json({
            error: 'Impact evaluation failed',
            details: err.message,
            stack: err.stack
        });
    }
};
