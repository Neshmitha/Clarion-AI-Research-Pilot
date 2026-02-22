const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log('Listing available Gemini models...');
    if (!API_KEY) {
        console.error('Error: GEMINI_API_KEY not found in .env');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // The SDK doesn't have a direct listModels, we usually use the REST API for that
        // OR we can try common alternatives.
        // Actually, the easiest is to check the documentation or try common ones.
        const axios = require('axios');
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        console.log('Available Models:');
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
            console.log(`  Supported Actions: ${m.supportedGenerationMethods.join(', ')}`);
        });
    } catch (err) {
        console.error('Failed to list models:', err.response?.data || err.message);
    }
}

listModels();
