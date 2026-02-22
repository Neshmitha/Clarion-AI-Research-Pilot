const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function listModels() {
    try {
        const response = await axios.get('https://api.x.ai/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`
            }
        });
        console.log("Available Models:");
        console.log(JSON.stringify(response.data.data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
