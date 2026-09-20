const Settings = require('../models/Settings');

const DEFAULT_SETTINGS = {
  organizationName: 'SnareNet',
  tagline: 'Follow the trail. Understand what happened.',
  description:
    'A professional platform for reporting suspected scams, fraud and digital financial crime so an investigation team can review the available trail.',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#E53935',
  secondaryColor: '#0D1117',
  contactEmail: '',
  contactPhone: '',
  website: '',
  heroHeading: 'Scammed? Report It. Start the Investigation.',
  heroDescription:
    'Provide the information you have about a suspected scam or fraudulent transaction. Our team can review the available details and determine the appropriate next steps.',
  disclaimer:
    'SnareNet does not guarantee recovery of lost funds. Every case depends on the available evidence, transaction trails, cooperation from relevant platforms or institutions, and applicable laws.',
  privacyNotice:
    'Never submit your password, OTP, PIN, banking login, crypto seed phrase or private key.',
  footerText: '© {year} {orgName}. All rights reserved.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
  aboutImageUrl:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
  ctaImageUrl:
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80',
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  smtpFromEmail: '',
  smtpFromName: '',
};

async function getSettings() {
  let settings = await Settings.findOne().sort({ createdAt: -1 });
  if (!settings) {
    settings = await Settings.create(DEFAULT_SETTINGS);
  }
  return settings;
}

module.exports = { getSettings, DEFAULT_SETTINGS };