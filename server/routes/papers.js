const express = require('express');
const router = express.Router();
const multer = require('multer');
const Paper = require('../models/Paper');
const path = require('path');
const axios = require('axios');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { userId, domain } = req.body;
        const dir = path.join(__dirname, '../user_workspace', userId, domain || 'Other');

        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload Paper
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { userId, title, domain, originalName } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Calculate relative path for database storage to keep it portable
        const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);

        const newPaper = new Paper({
            userId,
            title,
            domain,
            filePath: relativePath,
            originalName: originalName || req.file.originalname,
        });

        await newPaper.save();
        res.status(201).json({ message: 'Paper uploaded successfully', paper: newPaper });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// Get User's Papers
router.get('/:userId', async (req, res) => {
    try {
        const papers = await Paper.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Papers by Domain
router.get('/domain/:userId/:domain', async (req, res) => {
    try {
        const { userId, domain } = req.params;
        const papers = await Paper.find({ userId, domain }).sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Import Papers from external source (like arXiv)
router.post('/import', async (req, res) => {
    try {
        const { userId, papers } = req.body; // papers is an array of objects

        if (!papers || !Array.isArray(papers) || papers.length === 0) {
            return res.status(400).json({ message: 'No papers provided for import' });
        }

        const processedPapers = [];

        for (const paperData of papers) {
            // Papers now come with 'customTitle' and 'domain' from the frontend review modal
            const newPaper = new Paper({
                userId,
                title: paperData.customTitle || paperData.title,
                domain: paperData.domain || 'Other',
                pdfUrl: paperData.pdfLink,
                abstract: paperData.abstract,
                authors: paperData.authors,
                source: paperData.source || 'external',
                originalName: (paperData.customTitle || paperData.title).slice(0, 50)
            });

            await newPaper.save();
            processedPapers.push(newPaper);
        }

        res.status(201).json({ message: 'Papers imported successfully', papers: processedPapers });

    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Paper
router.put('/:id', async (req, res) => {
    try {
        const { title, domain } = req.body;
        const updatedPaper = await Paper.findByIdAndUpdate(
            req.params.id,
            { title, domain },
            { new: true }
        );
        res.json(updatedPaper);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Paper
router.delete('/:id', async (req, res) => {
    try {
        await Paper.findByIdAndDelete(req.params.id);
        // Optional: Delete file from filesystem if it exists and is local
        res.json({ message: 'Paper deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save Written Paper (Doc Space)
router.post('/write', async (req, res) => {
    try {
        const { userId, title, domain, content, paperId } = req.body;

        if (paperId) {
            // Update existing
            const updatedPaper = await Paper.findByIdAndUpdate(
                paperId,
                { title, domain, content },
                { new: true }
            );
            return res.json({ message: 'Paper saved successfully', paper: updatedPaper });
        } else {
            // Create new
            const newPaper = new Paper({
                userId,
                title: title || 'Untitled Draft',
                domain: domain || 'Other',
                content: content || '',
                source: 'written',
                originalName: 'Draft Paper'
            });
            await newPaper.save();
            return res.status(201).json({ message: 'Paper created successfully', paper: newPaper });
        }
    } catch (err) {
        console.error('Save Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
