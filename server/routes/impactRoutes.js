const express = require('express');
const router = express.Router();
const impactController = require('../controllers/impactController');

router.post('/calculate/:paperId', impactController.calculateImpact);

module.exports = router;
