const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // The listModels method is on the genAI object in some versions, 
        // or requires a specific client in others.
        // In @google/generative-ai, we might need to use the REST API directly if the SDK doesn't expose it easily.
        // But let's try a simple approach first.
        console.log("Testing API Key...");
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("test");
        console.log("Success with gemini-1.5-flash");
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
        console.log("Attempting to detect available models via fetch...");

        const fetch = require('node-fetch');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.models) {
                console.log("Available Models:");
                data.models.forEach(m => console.log("- " + m.name));
            } else {
                console.log("No models returned:", JSON.stringify(data));
            }
        } catch (err) {
            console.error("Fetch failed:", err.message);
        }
    }
}

listModels();
