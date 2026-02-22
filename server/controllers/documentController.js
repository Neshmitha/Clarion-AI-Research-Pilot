const Document = require('../models/Document');

// Create new document
exports.createDocument = async (req, res) => {
    try {
        const { userId, workspaceId, title, content } = req.body;
        const newDoc = new Document({
            userId,
            workspaceId: workspaceId || null,
            title: title || 'Untitled Document',
            content: content || ''
        });
        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all documents for a user (optionally filter by workspace)
exports.getDocuments = async (req, res) => {
    try {
        const { userId } = req.params;
        const { workspaceId } = req.query; // Support query param filtering

        let query = { userId };
        if (workspaceId) {
            query.workspaceId = workspaceId;
        }

        const docs = await Document.find(query).sort({ updatedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single document
exports.getDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update document
exports.updateDocument = async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedDoc = await Document.findByIdAndUpdate(
            req.params.id,
            { title, content },
            { new: true }
        );
        res.json(updatedDoc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete document
exports.deleteDocument = async (req, res) => {
    try {
        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
