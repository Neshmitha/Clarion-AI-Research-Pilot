const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testGemini() {
    try {
        console.log("Testing Gemini API Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
        console.log("Key starts with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "N/A");

        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("STATUS: SUCCESS");
    } catch (error) {
        console.error("STATUS: FAILURE");
        console.error("Error Message:", error.message);
        if (error.stack) {
            console.error("Stack Trace:", error.stack);
        }
    }
}

testGemini();
