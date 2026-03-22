const { runAIStreamWithPool } = require('../services/aiManager');

const ACTION_PROMPTS = {
    clarity: 'Rewrite this section to improve clarity and readability. Keep the same technical content but use clearer language, better sentence structure, and smoother transitions.',
    results: 'Expand this section by adding specific experimental results, performance metrics, and quantitative comparisons. Include realistic numbers like accuracy percentages, latency values, or dataset sizes.',
    math: 'Enhance this section by adding relevant mathematical models, equations, and formal notations. Use standard academic mathematical notation.',
    metrics: 'Add detailed evaluation metrics to this section. Include specific metrics like precision, recall, F1-score, BLEU, RMSE, or domain-appropriate measures with justification.',
    depth: 'Increase the technical depth of this section. Add more detailed technical explanations, cite underlying principles, and elaborate on implementation details.',
    refineContributions: 'Based on the following abstract and introduction, generate a "Contributions of This Work:" section with 3-5 technical bullet points. Each bullet should start with "We propose...", "We design...", "We evaluate...", "We demonstrate...", etc. Be specific and technical.',
};

exports.improveSection = async (req, res) => {
    try {
        const { sectionText, action } = req.body;
        if (!sectionText || !action) return res.status(400).json({ error: 'sectionText and action are required' });

        let actionPrompt = ACTION_PROMPTS.clarity;
        if (action.startsWith('custom:')) {
            const customQuery = action.replace('custom:', '').trim();
            actionPrompt = `Update the following text according to this specific instruction: "${customQuery}". Make the modifications cleanly and professionally.`;
        } else {
            actionPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.clarity;
        }

        const prompt = `${actionPrompt}

SECTION TO IMPROVE:
${sectionText}

RULES:
- Keep the same section heading if present.
- Output ONLY the improved section text in clean Markdown, no preamble.
- Do not add new major sections.`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        try {
            await runAIStreamWithPool(prompt, (chunk) => res.write(chunk));
        } catch (poolError) {
            console.error('[AI POOL] Improvement Stream Failed:', poolError.message);
            res.write('I encountered errors with all available AI services. Please try again later.');
        }

        res.end();

    } catch (err) {
        console.error('Improve section error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Improvement failed', details: err.message });
        else res.end();
    }
};
