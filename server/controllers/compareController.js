const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

        // 2. Ask Gemini to generate comparison paragraph + comparison table
        const paperList = papers.map((p, i) => `${i + 1}. "${p.title}" (${p.year}) — ${p.summary}`).join('\n');
        const prompt = `You are an academic research analyst. Given the topic "${topic}" and these related papers:

${paperList}

Generate:
1. A **highly analytical research synthesis paragraph** (5-7 sentences). Do not simply summarize the papers. Instead, explicitly identify the **technical research gap** that exists in the current state-of-the-art represented by these 5 papers. Discuss how the topic "${topic}" provides a novel solution or extension that addresses these specific limitations. 
2. A **formal comparison table** in markdown format with columns: | Paper | Year | Key Methodology | Core Contribution | Technical Limitation | Comparison to Our Work |

Be technical, scholarly, and professional. Output only the paragraph followed by the table.`;

        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        res.json({ papers, analysis });

    } catch (err) {
        console.error('Compare error:', err.message);
        res.status(500).json({ error: 'Comparison failed', details: err.message });
    }
};
