const { config } = require('../config');

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res, next) {
  res.status(404).json({ message: 'Resource not found' });
}

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ message: 'Malformed or oversized request body' });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages[0] || 'Validation failed' });
  }

  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }

  if (config.env === 'production') {
    // eslint-disable-next-line no-console
    console.error('[error]', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: err.message || 'Internal server error' });
}

module.exports = { ApiError, notFound, errorHandler };