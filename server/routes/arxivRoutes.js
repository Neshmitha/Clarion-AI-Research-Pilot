const express = require('express');
const router = express.Router();
const arxivController = require('../controllers/arxivController');

router.get('/search', arxivController.searchArxiv);

module.exports = router;
