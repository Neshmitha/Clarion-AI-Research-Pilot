const axios = require('axios');
const { runAIWithPool } = require('../services/aiManager');

// Search ArXiv and generate comparison paragraph + table using Gemini
exports.compareWithRelatedWork = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });

        // 1. Fetch related papers from ArXiv
        const query = encodeURIComponent(topic);
        const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=5&sortBy=relevance`;
        const arxivRes = await axios.get(arxivUrl, { timeout: 10000 });

        // Parse ArXiv Atom XML
        const xml = arxivRes.data;
        const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);

        const papers = entries.slice(0, 5).map(entry => {
            const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/\n/g, ' ').trim() || 'Unknown';
            const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.replace(/\n/g, ' ').trim().slice(0, 200) || '';
            const id = (entry.match(/<id>(.*?)<\/id>/) || [])[1]?.trim() || '';
            const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].map(a => a[1]).join(', ');
            const year = (entry.match(/(\d{4})/) || [])[1] || 'N/A';
            return { title, summary, id, authors, year };
        });

        if (papers.length === 0) {
            return res.status(404).json({ error: 'No related papers found on ArXiv for this topic.' });
        }

        // 2. Ask AI to generate comparison paragraph + comparison table
        const paperList = papers.map((p, i) => `${i + 1}. "${p.title}" (${p.year}) — ${p.summary}`).join('\n');
        const prompt = `You are an academic research analyst. Given the topic "${topic}" and these related papers:

${paperList}

Generate:
1. A **highly analytical research synthesis paragraph** (5-7 sentences). Do not simply summarize the papers. Instead, explicitly identify the **technical research gap** that exists in the current state-of-the-art represented by these 5 papers. Discuss how the topic "${topic}" provides a novel solution or extension that addresses these specific limitations. 
2. A **formal comparison table** in markdown format with columns: | Paper | Year | Key Methodology | Core Contribution | Technical Limitation | Comparison to Our Work |

Be technical, scholarly, and professional. Output only the paragraph followed by the table.`;

        try {
            const analysis = await runAIWithPool(prompt);
            res.json({ papers, analysis });
        } catch (poolErr) {
            console.error('[AI POOL] Related Work Comparison Failed:', poolErr.message);
            res.status(500).json({ error: 'Comparison failed on all AI services' });
        }

    } catch (err) {
        console.error('Compare error:', err.message);
        res.status(500).json({ error: 'Comparison failed', details: err.message });
    }
};

// Compare specific papers from the user's library
exports.compareSelectedPapers = async (req, res) => {
    try {
        const { papers } = req.body;
        if (!papers || !Array.isArray(papers) || papers.length < 2) {
            return res.status(400).json({ error: 'At least 2 papers are required for comparison' });
        }

        const paperList = papers.map((p, i) => `${i + 1}. "${p.title}" (${p.year || 'Unknown Year'}) — Domain: ${p.domain || 'N/A'}, Citations: ${p.citations || 0}, Impact Score: ${p.impactScore || 'N/A'}\n${p.abstract || p.summary || ''}`).join('\n\n');

        const prompt = `You are an expert academic research assistant. You have been asked to analyze and compare the following ${papers.length} research papers selected by the user:

${paperList}

Provide a highly professional and analytical comparative analysis. Your response should:
1. Briefly introduce the topic or common themes these papers cover.
2. Outline the key strengths and core contributions of each paper.
3. Compare their approaches, methodologies, or findings.
4. Conclude with a synthesizing paragraph on which paper might be most impactful or relevant depending on different research needs.

Format your response in Markdown. Do not include a table unless necessary. Be objective and scholarly.`;

        try {
            const analysis = await runAIWithPool(prompt);
            res.json({ analysis });
        } catch (poolErr) {
            console.error('[AI POOL] Custom Comparison Failed:', poolErr.message);
            res.status(500).json({ error: 'Comparison failed on all AI services' });
        }

    } catch (err) {
        console.error('Custom compare error:', err.message);
        res.status(500).json({ error: 'Custom Comparison failed', details: err.message });
    }
};
