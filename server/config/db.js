const mongoose = require('mongoose');
const { config } = require('./index');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    // eslint-disable-next-line no-console
    console.log('✓ MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };