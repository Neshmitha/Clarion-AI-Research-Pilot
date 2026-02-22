const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Paper = require('./models/Paper');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const papers = await Paper.find({ title: /Crop Spirals/i });
        console.log(`Found ${papers.length} matches for 'Crop Spirals':\n`);

        papers.forEach((p, i) => {
            console.log(`Match ${i + 1}: ${p.title}`);
            console.log(`   filePath: ${p.filePath || 'None'}`);
            console.log(`   pdfUrl: ${p.pdfUrl || 'None'}`);
            console.log(`   abstract: ${p.abstract ? p.abstract.substring(0, 100) + '...' : 'None'}`);
            console.log(`   content: ${p.content ? 'Available' : 'None'}`);
            console.log(`   source: ${p.source}`);
            console.log('---');
        });

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
