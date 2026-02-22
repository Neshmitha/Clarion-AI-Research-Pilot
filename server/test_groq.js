const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function test() {
    try {
        console.log("Testing Groq connection with key:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "llama3-8b-8192",
        });
        console.log("Response:", completion.choices[0].message.content);
        console.log("SUCCESS");
    } catch (err) {
        console.error("FAILURE:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
}

test();
