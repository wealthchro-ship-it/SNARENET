const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 100 },
    review: { type: String, trim: true, required: true, maxlength: 1000 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    approved: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ approved: 1, featured: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);