const express = require('express');
const router = express.Router();
const llamaController = require('../controllers/llamaController');

// Route to extract metadata from research paper
router.post('/extract', llamaController.extractMetadata);

module.exports = router;
