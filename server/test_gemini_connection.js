const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
    console.log('Testing Gemini API...');
    if (!API_KEY) {
        console.error('Error: GEMINI_API_KEY not found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Testing with both 2.5 and 1.5 to see what's available
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const modelName of models) {
        console.log(`\nTrying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        try {
            const result = await model.generateContent("Hello, are you working?");
            const response = await result.response;
            console.log(`Success with ${modelName}:`, response.text());
        } catch (err) {
            console.error(`Failed with ${modelName}:`, err.message);
            if (err.message.includes('quota')) {
                console.log('Suggestion: Quota exceeded for this model.');
            }
        }
    }
}

testGemini();
