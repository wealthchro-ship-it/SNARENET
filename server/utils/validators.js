const { body } = require('express-validator');
const { SCAM_TYPES } = require('../models/Report');

const scamTypeEnum = (value) =>
  SCAM_TYPES.includes(value) || value === undefined || value === '';

const reportValidators = [
  body('victim.fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name is required'),

  body('victim.email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email address'),
  body('victim.email').optional({ values: 'falsy' }).isLength({ max: 254 }),

  body('victim.phone').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('victim.whatsapp').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('victim.country').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  body('victim.state').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  body('victim.preferredContact')
    .optional({ values: 'falsy' })
    .isIn(['Email', 'Phone', 'WhatsApp'])
    .withMessage('Invalid preferred contact method'),

  body('incident.type')
    .trim()
    .custom((value) => SCAM_TYPES.includes(value))
    .withMessage('Select a valid scam type'),

  body('incident.date').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('incident.time').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('incident.amount').optional({ values: 'falsy' }).isString().isLength({ max: 60 }),
  body('incident.currency').optional({ values: 'falsy' }).isString().isLength({ max: 20 }),
  body('incident.country').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  body('incident.description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Please describe what happened (at least 20 characters)'),

  body('scammer.name').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('scammer.alias').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('scammer.phone').optional({ values: 'falsy' }).isString().isLength({ max: 40 }),
  body('scammer.email')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Invalid scammer email'),
  body('scammer.socialMedia').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('scammer.website').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
  body('scammer.bankName').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('scammer.accountName').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('scammer.accountNumber').optional({ values: 'falsy' }).isString().isLength({ max: 80 }),
  body('scammer.walletAddress').optional({ values: 'falsy' }).isString().isLength({ max: 200 }),
  body('scammer.otherInformation').optional({ values: 'falsy' }).isString().isLength({ max: 2000 }),

  body('transaction.reference').optional({ values: 'falsy' }).isString().isLength({ max: 200 }),
  body('transaction.transactionId').optional({ values: 'falsy' }).isString().isLength({ max: 200 }),
  body('transaction.cryptoHash').optional({ values: 'falsy' }).isString().isLength({ max: 300 }),
  body('transaction.sendingPlatform').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('transaction.receivingPlatform')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 150 }),
  body('transaction.paymentMethod').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),

  body('evidence.description').optional({ values: 'falsy' }).isString().isLength({ max: 3000 }),
  body('evidence.links').optional().isArray().withMessage('Evidence links must be a list'),
  body('evidence.urls').optional().isArray().withMessage('Evidence URLs must be a list'),

  body('consent')
    .isBoolean()
    .custom((value) => value === true)
    .withMessage('Consent is required to submit a report'),
];

module.exports = { reportValidators, scamTypeEnum };