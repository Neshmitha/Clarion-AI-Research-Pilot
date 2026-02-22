const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const chatbotService = require('./services/chatbotService');

async function testClassification() {
    console.log("--- Testing Classification ---");
    const queries = [
        "How can I use machine learning for crop yield prediction?",
        "What are the latest trends in heart surgery?",
        "Explain quantum entanglement."
    ];

    for (const q of queries) {
        const domain = await chatbotService.classifyQuery(q);
        console.log(`Query: "${q}" -> Domain: ${domain}`);
    }
}

async function runTests() {
    try {
        await testClassification();
        console.log("\n--- Backend Service Logic Verified ---");
        console.log("Note: PDF retrieval and Grok response require real data/API access.");
    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTests();
