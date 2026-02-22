const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Paper = require('../models/Paper');

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
const LLAMA_DEPLOYMENT_URL = process.env.LLAMA_DEPLOYMENT_URL || 'http://127.0.0.1:4501/deployments/extraction-review';

/**
 * Uploads a file to LlamaCloud beta files API
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} - The uploaded file ID
 */
async function uploadToLlamaCloud(filePath) {
    if (!LLAMA_CLOUD_API_KEY) {
        throw new Error('LLAMA_CLOUD_API_KEY not found in environment variables');
    }

    const form = new FormData();
    form.append('purpose', 'user_data');
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://api.cloud.llamaindex.ai/api/v1/beta/files', form, {
        headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
        }
    });

    return response.data.id;
}

/**
 * Extracts metadata from a research paper using LlamaIndex workflow
 */
exports.extractMetadata = async (req, res) => {
    try {
        const { filePath, pdfUrl, paperId } = req.body;
        let fileId;

        if (!LLAMA_CLOUD_API_KEY) {
            return res.status(500).json({ error: 'LLAMA_CLOUD_API_KEY is not configured on the server.' });
        }

        if (filePath) {
            // Case 1: Local file upload
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(__dirname, '..', filePath);

            if (!fs.existsSync(absolutePath)) {
                return res.status(404).json({ error: 'File not found at specified path' });
            }

            console.log(`Uploading local file to LlamaCloud (via Local Deployment): ${absolutePath}`);
            fileId = await uploadToLlamaCloud(absolutePath);
        } else if (pdfUrl) {
            // Case 2: URL (e.g. arXiv)
            // LlamaCloud beta files API typically requires a file upload.
            // For URLs, we'd ideally download first or use a direct URL feature if available.
            // For now, let's assume we download it briefly.
            const tempFileName = `temp_${Date.now()}.pdf`;
            const tempPath = path.join(__dirname, '..', 'uploads', tempFileName);

            console.log(`Downloading PDF from URL: ${pdfUrl}`);
            const writer = fs.createWriteStream(tempPath);
            const response = await axios({
                url: pdfUrl,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            fileId = await uploadToLlamaCloud(tempPath);

            // Cleanup temp file
            fs.unlinkSync(tempPath);
        } else {
            return res.status(400).json({ error: 'Missing filePath or pdfUrl' });
        }

        console.log(`File uploaded to LlamaCloud with ID: ${fileId}. Starting local workflow...`);

        // Step 2: Trigger the local workflow
        // The endpoint structure with local llamactl serve is:
        // /workflows/<workflow_name>/run
        const workflowName = 'process-file';
        const workflowResponse = await axios.post(`${LLAMA_DEPLOYMENT_URL}/workflows/${workflowName}/run`, {
            start_event: { file_id: fileId }
        }, {
            headers: {
                'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // The 'run' endpoint might be synchronous and return the extracted data or a handler
        // Based on the snippet, 'run' returns the result directly if it's sync.
        // If it returns a handler, we would need to poll /handlers/<id>.

        // Extract the actual metadata from the workflow result
        const metadata = workflowResponse.data?.result?.value?.result;

        console.log('Extracted Metadata:', metadata);

        // Step 3: Save metadata to the Paper model if paperId is provided
        if (paperId && metadata) {
            await Paper.findByIdAndUpdate(paperId, {
                llamaMetadata: metadata
            });
            console.log(`Saved LlamaIndex metadata for paper: ${paperId}`);
        }

        res.json({
            success: true,
            data: metadata || workflowResponse.data
        });

    } catch (err) {
        console.error('LlamaIndex Extraction Error:', err.response?.data || err.message);
        res.status(500).json({
            error: 'Failed to extract metadata from LlamaIndex',
            details: err.response?.data || err.message
        });
    }
};
