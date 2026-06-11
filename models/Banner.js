const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  image: { type: String, required: true },
  mobileImage: { type: String },
  link: { type: String },
  buttonText: { type: String, default: 'Shop Now' },
  position: { type: String, enum: ['hero', 'promo', 'featured'], default: 'hero' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });

bannerSchema.index({ isActive: 1, position: 1, order: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
