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
        console.log(`Total papers: ${papers.length}\n`);

        papers.forEach((p, i) => {
            console.log(`${i + 1}. Title: ${p.title}`);
            console.log(`   User: ${p.userId}`);
            console.log(`   Domain: ${p.domain}`);
            if (p.filePath) {
                const absPath = path.join(__dirname, p.filePath);
                const exists = fs.existsSync(absPath);
                console.log(`   Path: ${p.filePath} | Exists: ${exists}`);
            } else {
                console.log(`   Path: MISSING`);
            }
            console.log('---');
        });

        mongoose.connection.close();
    } catch (err) {
        console.error("Diagnosis Error:", err);
    }
}

diagnose();
