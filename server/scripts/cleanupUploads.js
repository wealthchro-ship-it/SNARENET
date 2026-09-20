require('dotenv').config();
const mongoose = require('mongoose');
const { config } = require('../config');
const Upload = require('../models/Upload');
const Settings = require('../models/Settings');

async function main() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  const uploads = await Upload.find();
  if (!uploads.length) {
    console.log('uploads: 0');
    await mongoose.disconnect();
    return;
  }
  const settings = await Settings.findOne();
  const refs = [settings.logoUrl, settings.faviconUrl, settings.heroImageUrl, settings.aboutImageUrl, settings.ctaImageUrl]
    .map((u) => (typeof u === 'string' ? (u.match(/\/api\/uploads\/([0-9a-f]{24})/) || [])[1] : null))
    .filter(Boolean);
  const stale = uploads.filter((u) => !refs.includes(String(u._id)));
  console.log(`total uploads: ${uploads.length} | referenced: ${refs.length} | stale: ${stale.length}`);
  if (stale.length) {
    const res = await Upload.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
    console.log(`deleted stale: ${res.deletedCount}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});