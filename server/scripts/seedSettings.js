require('dotenv').config();
const mongoose = require('mongoose');
const { config } = require('../config');
const Settings = require('../models/Settings');
const { DEFAULT_SETTINGS } = require('../services/settingsService');

async function main() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const existing = await Settings.findOne();
  if (existing) {
    const backfill = {};
    ['heroImageUrl', 'aboutImageUrl', 'ctaImageUrl'].forEach((key) => {
      if (!existing[key]) backfill[key] = DEFAULT_SETTINGS[key];
    });
    if (Object.keys(backfill).length) {
      Object.assign(existing, backfill);
      await existing.save();
      // eslint-disable-next-line no-console
      console.log('Backfilled image fields:', Object.keys(backfill).join(', '));
    } else {
      // eslint-disable-next-line no-console
      console.log('Settings already exist (id=%s). Nothing to do.', existing._id);
    }
    await mongoose.disconnect();
    return;
  }

  const doc = await Settings.create(DEFAULT_SETTINGS);
  // eslint-disable-next-line no-console
  console.log('✓ Default settings created (id=%s)', doc._id);
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to seed settings:', err.message);
  process.exit(1);
});