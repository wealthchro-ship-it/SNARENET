const { asyncHandler, ApiError } = require('../utils');
const { getSettings } = require('../services/settingsService');
const Settings = require('../models/Settings');
const { extractUploadId, deleteUpload } = require('../services/uploadService');
const { sendTestEmail, MASK } = require('../services/mailer');

const publicSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const pub = settings.toPublic();
  pub.emailEnabled = Boolean(settings.smtpHost && settings.smtpFromEmail);
  return res.json(pub);
});

const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const obj = settings.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  if (obj.smtpPass) obj.smtpPass = MASK;
  obj.smtpConfigured = Boolean(settings.smtpHost && settings.smtpFromEmail);
  return res.json(obj);
});

const testEmailSettings = asyncHandler(async (req, res) => {
  const current = await getSettings();
  const to = (req.body.to || '').trim();

  const preservePass =
    typeof req.body.smtpPass === 'string' ? req.body.smtpPass.trim() : '';
  const override = {
    smtpHost: req.body.smtpHost !== undefined ? String(req.body.smtpHost).trim() : current.smtpHost,
    smtpPort: Number(req.body.smtpPort !== undefined ? req.body.smtpPort : current.smtpPort) || 587,
    smtpSecure: req.body.smtpSecure !== undefined ? Boolean(req.body.smtpSecure) : current.smtpSecure,
    smtpUser: req.body.smtpUser !== undefined ? String(req.body.smtpUser).trim() : current.smtpUser,
    smtpPass: preservePass && preservePass !== MASK ? preservePass : current.smtpPass,
    smtpFromEmail:
      req.body.smtpFromEmail !== undefined
        ? String(req.body.smtpFromEmail).trim()
        : current.smtpFromEmail,
    smtpFromName:
      req.body.smtpFromName !== undefined
        ? String(req.body.smtpFromName).trim()
        : current.smtpFromName,
    organizationName: current.organizationName,
  };

  const result = await sendTestEmail(override, to);
  if (!result.sent) {
    throw new ApiError(500, result.reason || result.error || 'Could not send the test email.');
  }
  return res.json({ ok: true, message: `Test email sent to ${result.recipient}.` });
});

const IMAGE_FIELDS = ['logoUrl', 'faviconUrl', 'heroImageUrl', 'aboutImageUrl', 'ctaImageUrl'];

const updateAdminSettings = asyncHandler(async (req, res) => {
  const current = await getSettings();

  const allowed = [
    'organizationName',
    'tagline',
    'description',
    'logoUrl',
    'faviconUrl',
    'primaryColor',
    'secondaryColor',
    'contactEmail',
    'contactPhone',
    'website',
    'heroHeading',
    'heroDescription',
    'disclaimer',
    'privacyNotice',
    'footerText',
    'heroImageUrl',
    'aboutImageUrl',
    'ctaImageUrl',
    'smtpHost',
    'smtpPort',
    'smtpSecure',
    'smtpUser',
    'smtpPass',
    'smtpFromEmail',
    'smtpFromName',
  ];

  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] === undefined) return;
    if (key === 'smtpPort') {
      update[key] = Number(req.body[key]);
    } else if (key === 'smtpSecure') {
      update[key] = req.body[key] === true || req.body[key] === 'true';
    } else if (key === 'smtpPass' && String(req.body[key]).trim() === MASK) {
      // Masked sentinel — keep the existing password unchanged.
      return;
    } else {
      update[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  });

  // Detect uploaded images that are being replaced so the orphaned file can be removed.
  const replacedUploadIds = [];
  IMAGE_FIELDS.forEach((key) => {
    if (update[key] !== undefined && update[key] !== current[key]) {
      const oldId = extractUploadId(current[key]);
      if (oldId) replacedUploadIds.push(oldId);
    }
  });

  try {
    Object.assign(current, update);
    await current.save();
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      throw new ApiError(400, messages[0] || 'Invalid settings value');
    }
    throw err;
  }

  for (const id of replacedUploadIds) {
    // Only delete files that are no longer referenced by any image field.
    const stillReferenced = IMAGE_FIELDS.some((key) => extractUploadId(current[key]) === id);
    if (stillReferenced) continue;
    await deleteUpload(id).catch(() => {});
  }

  return res.json(current);
});

module.exports = {
  publicSettings,
  getAdminSettings,
  updateAdminSettings,
  testEmailSettings,
};