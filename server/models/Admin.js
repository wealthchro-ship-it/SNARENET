const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: { type: String, trim: true, maxlength: 150, default: 'Administrator' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
  };
};

module.exports = mongoose.model('Admin', adminSchema);