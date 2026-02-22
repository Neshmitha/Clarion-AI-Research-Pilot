const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const chatbotService = require('./services/chatbotService');

async function testRetrieval() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const userId = "6992bc6ecfa834be5e91ac33"; // User from diagnostic
        const domain = "Agriculture";
        const query = "What is the concept of crop spirals in future robotic agriculture?";

        console.log(`--- Testing Retrieval for Domain: ${domain} ---`);
        const { context, sources } = await chatbotService.getRelevantContext(userId, domain, query);

        if (context) {
            console.log("Context Found!");
            console.log("Sources:", sources);
            console.log("Context Preview:", context.substring(0, 500) + "...");
        } else {
            console.log("No Context Found.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

testRetrieval();
