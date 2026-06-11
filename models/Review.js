const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  comment: { type: String, trim: true },
  isVerifiedPurchase: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isActive: 1, createdAt: -1 });
reviewSchema.index({ isActive: 1, rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
