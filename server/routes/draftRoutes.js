const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');

router.post('/generate', draftController.generateDraft);

module.exports = router;
