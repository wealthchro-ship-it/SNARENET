const { config } = require('../config');
const Upload = require('../models/Upload');

const UPLOAD_ID_PATTERN = /\/api\/uploads\/([0-9a-f]{24})/;

function extractUploadId(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(UPLOAD_ID_PATTERN);
  return match ? match[1] : null;
}

function publicUrl(req, upload) {
  const base = config.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/api/uploads/${upload._id}`;
}

function deleteUpload(id) {
  if (!id) return Promise.resolve(false);
  return Upload.findByIdAndDelete(id).then((doc) => Boolean(doc));
}

module.exports = { extractUploadId, publicUrl, deleteUpload };