const express = require('express');
const { publicSettings } = require('../controllers/settingsController');
const { publicLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/public', publicLimiter, publicSettings);

module.exports = router;