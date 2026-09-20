const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      trim: true,
      default: 'SnareNet',
      maxlength: 100,
    },
    tagline: {
      type: String,
      trim: true,
      default: 'Follow the trail. Understand what happened.',
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default:
        'A professional platform for reporting suspected scams, fraud and digital financial crime so an investigation team can review the available trail.',
      maxlength: 2000,
    },
    logoUrl: { type: String, trim: true, maxlength: 600, default: '' },
    faviconUrl: { type: String, trim: true, maxlength: 600, default: '' },
    primaryColor: {
      type: String,
      trim: true,
      default: '#E53935',
      maxlength: 20,
    },
    secondaryColor: {
      type: String,
      trim: true,
      default: '#0D1117',
      maxlength: 20,
    },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    contactPhone: { type: String, trim: true, maxlength: 40, default: '' },
    website: { type: String, trim: true, maxlength: 300, default: '' },
    heroHeading: {
      type: String,
      trim: true,
      default: 'Scammed? Report It. Start the Investigation.',
      maxlength: 200,
    },
    heroDescription: {
      type: String,
      trim: true,
      default:
        'Provide the information you have about a suspected scam or fraudulent transaction. Our team can review the available details and determine the appropriate next steps.',
      maxlength: 1000,
    },
    disclaimer: {
      type: String,
      trim: true,
      default:
        'SnareNet does not guarantee recovery of lost funds. Every case depends on the available evidence, transaction trails, cooperation from relevant platforms or institutions, and applicable laws.',
      maxlength: 2000,
    },
    privacyNotice: {
      type: String,
      trim: true,
      default:
        'Never submit your password, OTP, PIN, banking login, crypto seed phrase or private key.',
      maxlength: 1000,
    },
    footerText: {
      type: String,
      trim: true,
      default: '© {year} {orgName}. All rights reserved.',
      maxlength: 500,
    },
    heroImageUrl: { type: String, trim: true, maxlength: 600, default: '' },
    aboutImageUrl: { type: String, trim: true, maxlength: 600, default: '' },
    ctaImageUrl: { type: String, trim: true, maxlength: 600, default: '' },

    smtpHost: { type: String, trim: true, maxlength: 253, default: '' },
    smtpPort: { type: Number, min: 1, max: 65535, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, trim: true, maxlength: 254, default: '' },
    smtpPass: { type: String, trim: true, maxlength: 254, default: '' },
    smtpFromEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    smtpFromName: { type: String, trim: true, maxlength: 150, default: '' },
  },
  { timestamps: true }
);

function publicSettings() {
  const safe = this.toObject ? this.toObject() : {};
  const { _id, __v, createdAt, updatedAt, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromEmail, smtpFromName, ...rest } = safe;
  return rest;
}

settingsSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.smtpHost;
  delete obj.smtpPort;
  delete obj.smtpSecure;
  delete obj.smtpUser;
  delete obj.smtpPass;
  delete obj.smtpFromEmail;
  delete obj.smtpFromName;
  return obj;
};

module.exports = mongoose.model('Settings', settingsSchema);