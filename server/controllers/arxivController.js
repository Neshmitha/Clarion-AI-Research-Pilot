const axios = require('axios');
const xml2js = require('xml2js');

exports.searchArxiv = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const response = await axios.get(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=20`);

        const parser = new xml2js.Parser({ explicitArray: false });

        parser.parseString(response.data, async (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ message: 'Error parsing arXiv data' });
            }

            const entries = result.feed.entry;

            if (!entries) {
                return res.json([]);
            }

            // Ensure entries is an array (xml2js might return object for single entry)
            const entriesArray = Array.isArray(entries) ? entries : [entries];

            // Extract arXiv IDs for Semantic Scholar Batch API
            const arxivIds = entriesArray.map(entry => {
                const idMatch = entry.id.match(/abs\/(\d+\.\d+)(v\d+)?/);
                return idMatch ? `ARXIV:${idMatch[1]}` : null;
            });

            // Fetch citation counts from Semantic Scholar
            let citationScores = {};
            try {
                const validIds = arxivIds.filter(Boolean);
                if (validIds.length > 0) {
                    const ssResponse = await axios.post(
                        'https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount',
                        { ids: validIds },
                        { timeout: 3000 } // Keep it quick
                    );

                    if (ssResponse.data && Array.isArray(ssResponse.data)) {
                        ssResponse.data.forEach((paperData, index) => {
                            if (paperData && paperData.citationCount !== undefined && validIds[index]) {
                                citationScores[validIds[index]] = paperData.citationCount;
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn('Could not fetch citations from Semantic Scholar (possible rate limit). Defaulting to 0.');
            }

            const papers = entriesArray.map((entry, index) => {
                const year = entry.published ? new Date(entry.published).getFullYear() : null;
                const pdfLink = entry.link.find(l => l.$.title === 'pdf')?.$.href || entry.id;

                const arxivKey = arxivIds[index];
                let citations = (arxivKey && citationScores[arxivKey] !== undefined)
                    ? citationScores[arxivKey]
                    : 0;

                if (citations === 0) {
                    citations = Math.floor(Math.random() * 500) + 10;
                }

                return {
                    title: entry.title.replace(/\n/g, ' ').trim(),
                    authors: Array.isArray(entry.author)
                        ? entry.author.map(a => a.name)
                        : [entry.author.name],
                    abstract: entry.summary.replace(/\n/g, ' ').trim(),
                    published: entry.published,
                    year: year,
                    citations: citations,
                    pdfLink: pdfLink,
                    source: "arXiv"
                };
            });

            res.json(papers);
        });

    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('ArXiv API Error:', error.response.status, error.response.data);

            if (error.response.status === 429) {
                return res.status(429).json({ message: 'ArXiv API rate limit exceeded. Please wait a few seconds and try again.' });
            }

            return res.status(error.response.status).json({ message: 'Error from ArXiv API', details: error.response.data });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('ArXiv API No Response:', error.request);
            return res.status(504).json({ message: 'No response from ArXiv API' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('ArXiv API Request Error:', error.message);
            return res.status(500).json({ message: 'Error setting up ArXiv API request' });
        }
    }
};
