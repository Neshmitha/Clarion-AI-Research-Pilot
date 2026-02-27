const express = require('express');
const router = express.Router();
const { compareWithRelatedWork, compareSelectedPapers } = require('../controllers/compareController');
router.post('/', compareWithRelatedWork);
router.post('/custom', compareSelectedPapers);
module.exports = router;
