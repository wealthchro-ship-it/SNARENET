const crypto = require('crypto');

// Format: SCR-YYYY-XXXXXX  (e.g. SCR-2026-A82F31)
function generateCaseId() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SCR-${year}-${random}`;
}

module.exports = { generateCaseId };