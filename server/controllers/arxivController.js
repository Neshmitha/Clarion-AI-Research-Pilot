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

        parser.parseString(response.data, (err, result) => {
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

            const papers = entriesArray.map(entry => ({
                title: entry.title.replace(/\n/g, ' ').trim(),
                authors: Array.isArray(entry.author)
                    ? entry.author.map(a => a.name)
                    : [entry.author.name],
                abstract: entry.summary.replace(/\n/g, ' ').trim(),
                published: entry.published,
                pdfLink: entry.link.find(l => l.$.title === 'pdf')?.$.href || entry.id,
                source: "arXiv"
            }));

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
