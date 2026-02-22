const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function listGroqModels() {
    try {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });
        console.log("Available Groq Models:");
        response.data.data.forEach(m => console.log("- " + m.id));
    } catch (error) {
        console.error("Error listing Groq models:", error.response ? error.response.data : error.message);
    }
}

listGroqModels();
