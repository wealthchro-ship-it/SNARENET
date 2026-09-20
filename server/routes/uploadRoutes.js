const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');
const Upload = require('../models/Upload');
const { publicUrl } = require('../services/uploadService');

const router = express.Router();

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed (PNG, JPG, GIF, WEBP, SVG, ICO, AVIF)'));
  },
});

function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image is too large. Maximum size is 5 MB.' });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  return next();
}

// Public: serve an uploaded image by id
router.get('/uploads/:id', async (req, res, next) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.setHeader('Content-Type', upload.contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.send(upload.data);
  } catch (err) {
    return next(err);
  }
});

// Admin: upload a new image from the device
router.post(
  '/admin/uploads',
  protect,
  adminLimiter,
  upload.single('file'),
  multerErrorHandler,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided. Choose an image to upload.' });
      }

      const saved = await Upload.create({
        fieldName: String(req.body.fieldName || '').slice(0, 60),
        originalName: String(req.file.originalname || '').replace(/[^\w.\- ]/g, '').slice(0, 255),
        contentType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      });

      return res.status(201).json({
        url: publicUrl(req, saved),
        id: saved._id,
        size: saved.size,
        contentType: saved.contentType,
      });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;