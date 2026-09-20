const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    fieldName: { type: String, trim: true, maxlength: 60, default: '' },
    originalName: { type: String, trim: true, maxlength: 255, default: '' },
    contentType: { type: String, trim: true, maxlength: 80, required: true },
    size: { type: Number, required: true, min: 1 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);