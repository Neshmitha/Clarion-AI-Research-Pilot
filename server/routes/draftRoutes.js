const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');

router.post('/generate', draftController.generateDraft);
router.post('/extract-references', draftController.extractReferencesList);
router.post('/extract-related-work', draftController.extractRelatedWork);
router.post('/extract-abstract', draftController.extractAbstract);
router.post('/extract-proposed-solution', draftController.extractProposedSolution);

module.exports = router;
