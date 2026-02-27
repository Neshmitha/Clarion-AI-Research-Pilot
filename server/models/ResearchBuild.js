const mongoose = require('mongoose');

const ResearchBuildSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, default: 'Untitled Research Build' },
    domain: { type: String, default: '' },
    selectedPapers: { type: Array, default: [] },
    problemStatement: { type: Object, default: null },
    methodology: { type: Array, default: [] },
    experiments: { type: Object, default: null },
    researchGap: { type: Object, default: null },
    score: { type: Object, default: null },
    currentStage: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ResearchBuild', ResearchBuildSchema);
