const axios = require('axios');

async function testDraftGeneration() {
    console.log('Testing Draft Generation with Fallback...');
    try {
        const response = await axios.post('http://localhost:5001/api/draft/generate', {
            topic: 'Autonomous Farming with AI',
            template: 'IEEE Journal',
            type: 'research',
            additionalInstructions: 'Focus on computer vision aspects.'
        }, {
            responseType: 'stream'
        });

        console.log('Stream started. Receiving content...');
        response.data.on('data', chunk => {
            process.stdout.write(chunk.toString());
        });

        response.data.on('end', () => {
            console.log('\nStream finished successfully.');
        });

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

testDraftGeneration();
