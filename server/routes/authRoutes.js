const express = require('express');
const { body } = require('express-validator');
const { login, logout, me, changeCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, adminLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8, max: 100 }),
  login
);

router.post('/logout', logout);
router.get('/me', protect, me);

router.patch(
  '/credentials',
  protect,
  adminLimiter,
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('newPassword')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('New password must be at least 8 characters'),
  body('confirmPassword')
    .optional({ values: 'falsy' })
    .isString()
    .custom((value, { req }) => value === (req.body.newPassword || ''))
    .withMessage('Passwords do not match'),
  changeCredentials
);

module.exports = router;