const axios = require('axios');

async function testChatbotFallback() {
    console.log('Testing Chatbot with Fallback...');
    try {
        const response = await axios.post('http://localhost:5001/api/chatbot/ask', {
            userId: '6999772aad57ef77b6c93abc', // Use a valid sample ID or what's in logs
            query: 'What are the main findings of the Attention paper?',
            domain: 'Computer Science'
        });

        console.log('Chatbot Answer:', response.data.answer);
        console.log('SUCCESS');

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

testChatbotFallback();
