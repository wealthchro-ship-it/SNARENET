require('dotenv').config();
const mongoose = require('mongoose');
const { config } = require('../config');
const Admin = require('../models/Admin');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
    process.exit(1);
  }
  if (password.length < 8) {
    // eslint-disable-next-line no-console
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const existing = await Admin.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.error('An admin with that email already exists.');
    process.exit(1);
  }

  await Admin.create({ email, password });
  // eslint-disable-next-line no-console
  console.log('✓ Admin created:', email);
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});