const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const Paper = require('../models/Paper');
const { runAIWithPool } = require('../services/aiManager');

/**
 * Extracts text from a local PDF file using pdf-parse
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Downloads a PDF from a URL to a temporary local path
 */
async function downloadPDF(pdfUrl, tempPath) {
    const writer = fs.createWriteStream(tempPath);
    const response = await axios({
        url: pdfUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000,
        headers: { 'User-Agent': 'Clarion/1.0' }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

/**
 * Uses AI Pool to extract structured research metadata from raw PDF text
 */
async function extractMetadataWithAI(pdfText, paperTitle) {
    const truncatedText = pdfText.substring(0, 12000);

    const prompt = `You are a research paper analysis expert. Extract structured metadata from the following research paper text.

Paper Text:
${truncatedText}

Return ONLY a valid JSON object (no markdown, no extra text) with these fields:
{
  "title": "Full paper title",
  "abstract": "Complete abstract text",
  "authors": ["Author 1", "Author 2"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "methodology": {
    "approach": "Brief description of the core approach",
    "techniques": ["technique1", "technique2"],
    "datasets": ["dataset1", "dataset2"]
  },
  "findings": {
    "main_result": "Key result or contribution in one sentence",
    "metrics": ["metric1: value1", "metric2: value2"],
    "conclusion": "Brief conclusion"
  },
  "domain": "Research domain (e.g. Computer Vision, NLP, etc.)",
  "year": "Publication year if found"
}`;

    try {
        const rawText = await runAIWithPool(prompt, { jsonMode: true });

        // Strip markdown code fences if present
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('JSON parse failed, returning fallback metadata');
            return {
                title: paperTitle || 'Unknown',
                abstract: pdfText.substring(0, 800),
                keywords: [],
                methodology: { approach: 'See full paper text' },
                findings: { main_result: 'See full paper text' }
            };
        }
    } catch (poolErr) {
        console.error('[AI POOL] Metadata Extraction Failed:', poolErr.message);
        throw poolErr;
    }
}

/**
 * Main extraction endpoint - replaces LlamaIndex with AI Pool + pdf-parse
 */
exports.extractMetadata = async (req, res) => {
    let tempPath = null;

    try {
        const { filePath, pdfUrl, paperId } = req.body;
        let pdfText = '';
        let paperTitle = '';

        let hasWrittenContent = false;

        // Get paper title if we have a paperId
        if (paperId) {
            const paper = await Paper.findById(paperId);
            if (paper) {
                paperTitle = paper.title;
                if (paper.content) {
                    // Extract text from the drafted HTML content, removing HTML tags
                    pdfText = paper.content.replace(/<[^>]*>?/gm, ' ');
                    hasWrittenContent = true;
                }
            }
        }

        if (hasWrittenContent) {
            console.log(`Extracting text from drafted paper content: ${paperTitle}`);
        } else if (filePath) {
            // Case 1: Local uploaded PDF
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(__dirname, '..', filePath);

            if (!fs.existsSync(absolutePath)) {
                return res.status(404).json({ error: 'File not found at specified path' });
            }

            console.log(`Extracting text from local PDF: ${absolutePath}`);
            pdfText = await extractTextFromPDF(absolutePath);

        } else if (pdfUrl) {
            // Case 2: Remote PDF URL (e.g. arXiv)
            const tempFileName = `temp_${Date.now()}.pdf`;
            tempPath = path.join(__dirname, '..', 'uploads', tempFileName);

            // Ensure uploads dir exists
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            console.log(`Downloading PDF from URL: ${pdfUrl}`);
            await downloadPDF(pdfUrl, tempPath);
            pdfText = await extractTextFromPDF(tempPath);

        } else {
            return res.status(400).json({ error: 'Missing filePath, pdfUrl, or paper content' });
        }

        if (!pdfText || pdfText.trim().length < 100) {
            return res.status(422).json({ error: 'Could not extract readable text from this PDF. It may be scanned or image-based.' });
        }

        console.log(`Extracted ${pdfText.length} characters. Sending to AI Pool for analysis...`);

        // Use AI Pool to extract structured metadata
        const metadata = await extractMetadataWithAI(pdfText, paperTitle);

        console.log('Extraction successful:', metadata?.title);

        // Save to Paper model if paperId provided
        if (paperId && metadata) {
            await Paper.findByIdAndUpdate(paperId, { llamaMetadata: metadata });
            console.log(`Saved metadata for paper: ${paperId}`);
        }

        res.json({ success: true, data: metadata });

    } catch (err) {
        console.error('Extraction Error:', err.message);
        res.status(500).json({
            error: 'Failed to extract metadata',
            details: err.message
        });
    } finally {
        // Cleanup temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
};
