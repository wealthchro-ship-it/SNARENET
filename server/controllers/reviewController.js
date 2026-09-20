const { asyncHandler, ApiError } = require('../utils');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');

const publicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ approved: true })
    .sort({ featured: -1, createdAt: -1 })
    .limit(50)
    .lean();
  const safe = reviews.map((r) => ({
    id: r._id,
    name: r.name,
    location: r.location,
    review: r.review,
    rating: r.rating,
    featured: r.featured,
  }));
  return res.json(safe);
});

const adminList = asyncHandler(async (req, res) => {
  const { approved, featured, q } = req.query;
  const filter = {};
  if (approved === 'true') filter.approved = true;
  if (approved === 'false') filter.approved = false;
  if (featured === 'true') filter.featured = true;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { review: { $regex: q, $options: 'i' } },
    ];
  }
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return res.json(reviews);
});

const adminCreate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0]?.msg || 'Validation failed');
  }
  const { name, location, review, rating, approved, featured } = req.body;
  const doc = await Review.create({
    name,
    location: location || '',
    review,
    rating,
    approved: approved === true || approved === 'true',
    featured: featured === true || featured === 'true',
  });
  return res.status(201).json(doc);
});

const adminUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(404, 'Review not found');

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Review not found');

  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0]?.msg || 'Validation failed');

  const allowed = ['name', 'location', 'review', 'rating', 'approved', 'featured'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      review[key] =
        typeof req.body[key] === 'boolean'
          ? req.body[key]
          : key === 'rating'
            ? Number(req.body[key])
            : String(req.body[key]);
      if (typeof req.body[key] === 'string') review[key] = req.body[key].trim();
    }
  });

  if (req.body.approved === false || req.body.approved === 'false') review.approved = false;
  if (req.body.featured === false || req.body.featured === 'false') review.featured = false;

  await review.save();
  return res.json(review);
});

const adminDelete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(404, 'Review not found');

  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new ApiError(404, 'Review not found');

  return res.json({ message: 'Review deleted' });
});

module.exports = { publicReviews, adminList, adminCreate, adminUpdate, adminDelete };