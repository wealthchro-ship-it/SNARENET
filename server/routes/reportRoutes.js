const express = require('express');
const { publicCreate, publicLookup } = require('../controllers/reportController');
const { reportValidators } = require('../utils/validators');
const { reportLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', reportLimiter, reportValidators, publicCreate);
router.get('/:caseId', publicLookup);

module.exports = router;