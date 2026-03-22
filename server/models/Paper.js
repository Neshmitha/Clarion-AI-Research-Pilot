const mongoose = require('mongoose');

const PaperSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    domain: {
        type: String,
        required: true,
        enum: [
            'Agriculture', 'Climate', 'Medtech',
            'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
            'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
            'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
            'Environmental Science', 'Other'
        ]
    },
    filePath: { type: String, required: false }, // Optional for external papers
    pdfUrl: { type: String, required: false },   // For arXiv links
    abstract: { type: String, required: false },
    authors: { type: [String], required: false },
    source: { type: String, default: 'upload' }, // 'upload' or 'arXiv'
    originalName: { type: String, required: false }, // Optional for written/external
    content: { type: String, required: false }, // For Doc Space papers
    googleDocId: { type: String, required: false }, // For Google Docs integration
    template: { type: String, default: 'IEEE Journal' }, // Template format for Doc Space
    llamaMetadata: { type: Object, required: false }, // Extracted metadata from LlamaIndex
    isFavorite: { type: Boolean, default: false }, // User marked as favorite
    notes: { type: String, default: '' }, // User notes for the library
    impactScore: { type: Number, required: false }, // AI-calculated score (0-100)
    impactBreakdown: { type: Object, required: false }, // Breakdown of scoring criteria
    impactJustification: { type: String, required: false }, // AI's justification for the score
    citations: { type: Number, default: 0 }, // Actual or fetched citation count
    year: { type: Number, required: false }, // Publication year
    uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Paper', PaperSchema);
