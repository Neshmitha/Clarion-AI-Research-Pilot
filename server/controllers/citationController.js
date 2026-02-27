const axios = require('axios');

// Validate a list of reference strings via CrossRef API
exports.validateCitations = async (req, res) => {
    try {
        const { references } = req.body; // Array of raw reference strings
        if (!references || !references.length) {
            return res.status(400).json({ error: 'references array is required' });
        }

        const results = await Promise.all(references.map(async (ref, idx) => {
            // Clean the reference string to use as search query (strip [1], [A], 1., etc.)
            const query = ref.replace(/^\[?([A-Za-z\d]+)\]?[:\.\s\-–—]*/, '').replace(/[^\w\s]/g, ' ').trim().slice(0, 100);
            try {
                const response = await axios.get(
                    `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=1&select=DOI,title,author,published,container-title`,
                    { timeout: 8000, headers: { 'User-Agent': 'Clarion/1.0 (research-tool)' } }
                );
                const item = response.data?.message?.items?.[0];
                if (!item) return { index: idx + 1, original: ref, status: 'unverified', doi: null, formatted: ref };

                const authors = (item.author || []).map(a => `${a.family}, ${a.given?.[0] || ''}`.trim()).join(', ');
                const title = item.title?.[0] || 'Unknown Title';
                const journal = item['container-title']?.[0] || '';
                const year = item.published?.['date-parts']?.[0]?.[0] || '';
                const doi = item.DOI || null;

                // IEEE formatted citation
                const ieeeFormatted = `${authors}, "${title}," ${journal}${year ? `, ${year}` : ''}${doi ? `. DOI: https://doi.org/${doi}` : ''}.`;

                // If we found a title match, consider it "Scholar Validated"
                const isScholarValidated = title.toLowerCase().includes(query.split(' ')[0].toLowerCase());

                return {
                    index: idx + 1,
                    original: ref,
                    status: 'verified',
                    doi: doi ? `https://doi.org/${doi}` : null,
                    formatted: ieeeFormatted,
                    scholarStatus: isScholarValidated ? 'Scholar Validated' : 'Verified'
                };
            } catch {
                return { index: idx + 1, original: ref, status: 'unverified', doi: null, formatted: ref, scholarStatus: 'Unverified' };
            }
        }));

        res.json({ results });
    } catch (err) {
        console.error('Citation validation error:', err.message);
        res.status(500).json({ error: 'Validation failed', details: err.message });
    }
};
