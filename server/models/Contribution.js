const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    issueTitle: { type: String, required: true },
    issueDescription: { type: String, required: true },
    questions: {
        type: [String],
        validate: [v => v.length === 3, 'Exactly 3 questions are required per issue']
    },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const ResponseSchema = new mongoose.Schema({
    issueId: { type: mongoose.Schema.Types.ObjectId, required: true },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: {
        type: [String],
        validate: [v => v.length === 3, 'Exactly 3 answers are required']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },

    // Task Extended Data
    deadline: { type: Date },
    assignedAt: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    optionalInstructions: { type: String },
    taskStatus: {
        type: String,
        enum: ['none', 'assigned', 'submitted', 'completed', 'overdue'],
        default: 'none'
    },

    // Submission Data
    solutionPDF: { type: String },
    solutionDescription: { type: String },
    submittedAt: { type: Date },
    submissionStatus: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'rejected'],
        default: 'pending'
    },

    // Rating Data
    rating: { type: Number, min: 1, max: 5 },
    ratingComment: { type: String },
    ratedAt: { type: Date },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now }
});

const ContributionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    domain: { type: String, required: true },
    type: {
        type: String,
        enum: ['summary', 'insight', 'idea', 'replication', 'improvement', 'survey'],
        required: true
    },
    description: { type: String },
    researchPaperFile: { type: String }, // PDF upload URL or document link
    tags: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    issues: [IssueSchema],
    responses: [ResponseSchema],
    contributorsList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Analytics/Bonus
    views: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
    aiNoveltyScore: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes
ContributionSchema.index({ domain: 1 });
ContributionSchema.index({ type: 1 });
ContributionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contribution', ContributionSchema);
