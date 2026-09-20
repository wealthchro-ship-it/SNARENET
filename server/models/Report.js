const mongoose = require('mongoose');

const scamTypes = [
  'Bank Transfer',
  'Cryptocurrency',
  'Investment',
  'Fake Store',
  'Phishing',
  'Social Media',
  'Romance Scam',
  'Impersonation',
  'Account Takeover',
  'Other',
];

const caseStatuses = [
  'NEW',
  'UNDER_REVIEW',
  'INVESTIGATING',
  'SCAMMER_IDENTIFIED',
  'RECOVERY_IN_PROGRESS',
  'RECOVERED',
  'CLOSED',
  'ARCHIVED',
];

const reportSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },

    victim: {
      fullName: { type: String, trim: true, required: true, maxlength: 150 },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, trim: true, maxlength: 40 },
      whatsapp: { type: String, trim: true, maxlength: 40 },
      country: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      preferredContact: {
        type: String,
        enum: ['Email', 'Phone', 'WhatsApp'],
        default: 'Email',
      },
    },

    incident: {
      type: { type: String, enum: scamTypes, required: true },
      date: { type: String, trim: true, maxlength: 40 },
      time: { type: String, trim: true, maxlength: 40 },
      amount: { type: String, trim: true, maxlength: 60 },
      currency: { type: String, trim: true, maxlength: 20, default: 'USD' },
      country: { type: String, trim: true, maxlength: 100 },
      description: { type: String, trim: true, required: true, maxlength: 5000 },
    },

    scammer: {
      name: { type: String, trim: true, maxlength: 150 },
      alias: { type: String, trim: true, maxlength: 150 },
      phone: { type: String, trim: true, maxlength: 40 },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      socialMedia: { type: String, trim: true, maxlength: 500 },
      website: { type: String, trim: true, maxlength: 500 },
      bankName: { type: String, trim: true, maxlength: 150 },
      accountName: { type: String, trim: true, maxlength: 150 },
      accountNumber: { type: String, trim: true, maxlength: 80 },
      walletAddress: { type: String, trim: true, maxlength: 200 },
      otherInformation: { type: String, trim: true, maxlength: 2000 },
    },

    transaction: {
      reference: { type: String, trim: true, maxlength: 200 },
      transactionId: { type: String, trim: true, maxlength: 200 },
      cryptoHash: { type: String, trim: true, maxlength: 300 },
      sendingPlatform: { type: String, trim: true, maxlength: 150 },
      receivingPlatform: { type: String, trim: true, maxlength: 150 },
      paymentMethod: { type: String, trim: true, maxlength: 150 },
    },

    evidence: {
      description: { type: String, trim: true, maxlength: 3000 },
      links: [{ type: String, trim: true, maxlength: 600 }],
      urls: [{ type: String, trim: true, maxlength: 600 }],
    },

    consent: { type: Boolean, required: true },

    status: { type: String, enum: caseStatuses, default: 'NEW', index: true },
    assignedInvestigator: { type: String, trim: true, maxlength: 150 },

    notes: [
      {
        text: { type: String, trim: true, required: true, maxlength: 5000 },
        author: { type: String, trim: true, maxlength: 150 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

reportSchema.index({ 'victim.fullName': 'text', caseId: 'text' });

module.exports = {
  Report: mongoose.model('Report', reportSchema),
  SCAM_TYPES: scamTypes,
  CASE_STATUSES: caseStatuses,
};