const axios = require('axios');
require('dotenv').config();

const API_ENDPOINT = 'http://localhost:5001/api/llama/extract';

async function testExtraction() {
    console.log('Testing LlamaIndex Extraction...');

    // Using a sample PDF URL for testing
    const testData = {
        pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf' // "Attention Is All You Need"
    };

    try {
        const response = await axios.post(API_ENDPOINT, testData);
        console.log('Success!');
        console.log('Extracted Data:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Test Failed!');
        console.error('Error:', err.response?.data || err.message);
        console.log('\nNOTE: Ensure the server is running on port 5001 and LLAMA_CLOUD_API_KEY is set in .env');
    }
}

testExtraction();
