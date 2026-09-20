const express = require('express');
const { publicReviews } = require('../controllers/reviewController');
const { publicLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/', publicLimiter, publicReviews);

module.exports = router;