const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace', // Assuming you have a Workspace model, otherwise just ObjectId
        required: false
    },
    title: {
        type: String,
        default: 'Untitled Document'
    },
    content: {
        type: String, // HTML content
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
