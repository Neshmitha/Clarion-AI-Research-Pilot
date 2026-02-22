const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const chatbotService = require('./services/chatbotService');

async function testGemini() {
    console.log("--- Testing Gemini Classification ---");
    const queries = [
        "How can I use machine learning for crop yield prediction?",
        "What are the latest trends in heart surgery?",
        "Explain quantum entanglement."
    ];

    for (const q of queries) {
        try {
            const domain = await chatbotService.classifyQuery(q);
            console.log(`Query: "${q}" -> Domain: ${domain}`);
        } catch (err) {
            console.error(`Error classifying "${q}":`, err.message);
        }
    }
}

async function runTests() {
    try {
        await testGemini();
        console.log("\n--- Gemini Integration Verified ---");
    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTests();
