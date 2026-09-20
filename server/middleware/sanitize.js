/* Strip HTML and dangerous control characters from user input.
   Runs after mongoose pre-save hooks but before validation/persistence
   so stored reports and reviews are always plain text. */
const HTML_TAG_REGEX = /<\/?[a-z][^>]*>/gi;
const CONTROL_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  let out = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  out = out.replace(HTML_TAG_REGEX, '');
  out = out.replace(CONTROL_REGEX, '');
  return out;
}

function sanitizeValue(value) {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') return sanitizeObject(value);
  return value;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  Object.keys(obj).forEach((key) => {
    clean[key] = sanitizeValue(obj[key]);
  });
  return clean;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  return next();
}

module.exports = { sanitizeBody, sanitizeString };