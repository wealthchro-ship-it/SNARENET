const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { config } = require('./config');
const { connectDB } = require('./config/db');
const { sanitizeBody } = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(sanitizeBody);

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({
    status: 'ok',
    mongo: mongoState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const Admin = require('./models/Admin');
const Settings = require('./models/Settings');
const { DEFAULT_SETTINGS } = require('./services/settingsService');

async function seedDefaults() {
  const settings = await Settings.findOne();
  const backfill = {};
  ['heroImageUrl', 'aboutImageUrl', 'ctaImageUrl'].forEach((key) => {
    if (!settings || !settings[key]) backfill[key] = DEFAULT_SETTINGS[key];
  });
  if (settings) {
    if (Object.keys(backfill).length) {
      Object.assign(settings, backfill);
      await settings.save();
      // eslint-disable-next-line no-console
      console.log('Seeded missing settings fields:', Object.keys(backfill).join(', '));
    }
  } else {
    await Settings.create(DEFAULT_SETTINGS);
    // eslint-disable-next-line no-console
    console.log('✓ Default settings created');
  }

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (email && password.length >= 8) {
    const existing = await Admin.findOne({ email });
    if (!existing) {
      await Admin.create({ email, password });
      // eslint-disable-next-line no-console
      console.log('✓ Admin auto-created from env:', email);
    }
  }
}

async function start() {
  await connectDB();
  await seedDefaults();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`✓ SnareNet server listening on port ${config.port} (${config.env})`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;