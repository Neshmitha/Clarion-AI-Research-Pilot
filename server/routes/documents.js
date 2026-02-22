const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Routes
router.post('/', documentController.createDocument);
router.get('/user/:userId', documentController.getDocuments);
router.get('/:id', documentController.getDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
