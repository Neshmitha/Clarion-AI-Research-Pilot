const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

const Paper = require('./models/Paper');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const papers = await Paper.find({});
        console.log(`Total papers in DB: ${papers.length}`);

        if (papers.length > 0) {
            const sample = papers[0];
            console.log("Sample Paper Record:");
            console.log(JSON.stringify(sample, null, 2));

            const absolutePath = path.join(__dirname, sample.filePath);
            console.log(`Resolved Path: ${absolutePath}`);
            console.log(`File exists at resolved path: ${fs.existsSync(absolutePath)}`);

            // Check relative path from services/chatbotService.js logic
            const serviceLogicPath = path.join(__dirname, '..', sample.filePath);
            console.log(`Service Logic Resolved Path (from server/): ${serviceLogicPath}`);
            console.log(`File exists at service logic path: ${fs.existsSync(serviceLogicPath)}`);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error("Diagnosis Error:", err);
    }
}

diagnose();
