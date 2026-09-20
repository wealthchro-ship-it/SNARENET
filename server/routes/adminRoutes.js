const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');
const {
  adminList,
  adminGet,
  adminUpdate,
  adminArchive,
  adminDelete,
  addNote,
  updateNote,
  deleteNote,
  dashboardStats,
} = require('../controllers/reportController');
const {
  adminList: reviewList,
  adminCreate,
  adminUpdate: reviewUpdate,
  adminDelete: reviewDelete,
} = require('../controllers/reviewController');
const { getAdminSettings, updateAdminSettings, testEmailSettings } = require('../controllers/settingsController');
const { exportExcel } = require('../controllers/exportController');

const router = express.Router();

router.use(protect);
router.use(adminLimiter);

// Dashboard
router.get('/dashboard', dashboardStats);

// Reports
router.get('/reports', adminList);
router.get('/reports/:caseId', adminGet);
router.patch('/reports/:caseId', adminUpdate);
router.post('/reports/:caseId/archive', adminArchive);
router.delete('/reports/:caseId', adminDelete);

// Internal notes
router.post(
  '/reports/:caseId/notes',
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Note text is required'),
  addNote
);
router.patch(
  '/reports/:caseId/notes/:noteId',
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Note text is required'),
  updateNote
);
router.delete('/reports/:caseId/notes/:noteId', deleteNote);

// Excel export
router.get('/export', exportExcel);

// Reviews
router.get('/reviews', reviewList);
router.post(
  '/reviews',
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('location').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('review').trim().isLength({ min: 5, max: 1000 }).withMessage('Review is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('approved').optional().isBoolean(),
  body('featured').optional().isBoolean(),
  adminCreate
);
router.patch(
  '/reviews/:id',
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('location').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('review')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Review is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('approved').optional().isBoolean(),
  body('featured').optional().isBoolean(),
  reviewUpdate
);
router.delete('/reviews/:id', reviewDelete);

// Settings
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);
router.post(
  '/settings/test-email',
  body('to').optional({ values: 'falsy' }).isEmail().withMessage('Invalid recipient email'),
  testEmailSettings
);

module.exports = router;