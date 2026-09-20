const jwt = require('jsonwebtoken');
const { config } = require('../config');
const Admin = require('../models/Admin');

async function protect(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies[config.jwtCookieName]) {
      token = req.cookies[config.jwtCookieName];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = { protect };