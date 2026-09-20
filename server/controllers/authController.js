const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { config } = require('../config');
const { ApiError, asyncHandler } = require('../utils');

function signToken(adminId) {
  return jwt.sign({ id: adminId }, config.jwtSecret, { expiresIn: '8h' });
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: config.isProduction ? 'none' : 'lax',
  secure: config.isProduction,
  maxAge: 8 * 60 * 60 * 1000,
};

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    // Generic message: never reveal whether the email exists
    throw new ApiError(401, 'Invalid email or password');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin._id);
  res.cookie(config.jwtCookieName, token, COOKIE_OPTIONS);

  return res.json({ admin: admin.toSafeObject() });
});

const logout = (req, res) => {
  res.clearCookie(config.jwtCookieName, {
    httpOnly: true,
    sameSite: config.isProduction ? 'none' : 'lax',
    secure: config.isProduction,
  });
  return res.json({ message: 'Logged out' });
};

const me = asyncHandler(async (req, res) => {
  return res.json({ admin: req.admin.toSafeObject() });
});

const changeCredentials = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({ message: first.msg || 'Invalid request' });
  }

  const { currentPassword, email, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!admin || !(await admin.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const wantsEmailChange = trimmedEmail && trimmedEmail !== admin.email;
  const wantsPasswordChange = typeof newPassword === 'string' && newPassword.length > 0;

  if (!wantsEmailChange && !wantsPasswordChange) {
    return res.status(400).json({ message: 'Enter a new email or a new password to update.' });
  }

  if (wantsEmailChange) {
    const exists = await Admin.exists({ email: trimmedEmail, _id: { $ne: admin._id } });
    if (exists) {
      throw new ApiError(409, 'An admin with that email already exists');
    }
    admin.email = trimmedEmail;
  }

  if (wantsPasswordChange) {
    admin.password = newPassword; // hashed by the pre-save hook
  }

  await admin.save();

  return res.json({
    message: 'Login details updated.',
    admin: admin.toSafeObject(),
  });
});

module.exports = { login, logout, me, changeCredentials, COOKIE_OPTIONS };