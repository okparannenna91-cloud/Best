const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String },
  price: { type: Number },
  stock: { type: Number, default: 0 },
  attributes: { type: Map, of: String },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  }],
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  costPrice: { type: Number },
  stock: { type: Number, default: 0 },
  sku: { type: String },
  variants: [variantSchema],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  tags: [{ type: String, lowercase: true }],
  badge: { type: String, enum: ['', 'New', 'Trending', 'Best Seller', 'Sale'] },
  specifications: [{ label: { type: String }, value: { type: String } }],
  ratingsAverage: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
}, { timestamps: true });

productSchema.virtual('imageUrls').get(function () {
  return (this.images || []).map(img => (typeof img === 'string' ? img : img.url));
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
