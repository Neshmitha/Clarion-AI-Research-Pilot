const express = require('express');
const router = express.Router();
const { validateCitations } = require('../controllers/citationController');
router.post('/validate', validateCitations);
module.exports = router;
