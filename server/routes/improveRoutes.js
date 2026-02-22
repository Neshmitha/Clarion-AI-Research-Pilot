const express = require('express');
const router = express.Router();
const { improveSection } = require('../controllers/improveController');
router.post('/', improveSection);
module.exports = router;
