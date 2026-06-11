const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bannerImage: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

flashSaleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('FlashSale', flashSaleSchema);
