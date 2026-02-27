require('dotenv').config();
const mongoose = require('mongoose');
const Paper = require('./models/Paper');
const chatbotService = require('./services/chatbotService');

mongoose.connect(process.env.MONGO_URI, {})
    .then(async () => {
        console.log("Connected");
        const papers = await Paper.find({ source: 'written' }).limit(1);
        if (papers.length > 0) {
            const paper = papers[0];
            console.log("Found paper:", paper.title);
            console.log("Content length:", paper.content ? paper.content.length : 0);
            const { context, sources } = await chatbotService.getRelevantContext(paper.userId, paper.domain, "test", paper._id);
            console.log("Sources:", sources);
            console.log("Context starts with:", context ? context.substring(0, 500) : "null");

            // test generate response
            const res = await chatbotService.generateResponse("What is this paper about?", context, "Other");
            console.log("Response:", res);
        } else {
            console.log("No written papers found");
        }
        process.exit(0);
    });
