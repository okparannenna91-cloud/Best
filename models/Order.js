const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String },
  sku: { type: String },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clerkId: { type: String },
  email: { type: String, required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Nigeria' },
  },
  shippingMethod: { type: String },
  shippingCost: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending',
  },
  paymentMethod: { type: String, default: 'Paystack' },
  paymentReference: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  trackingNumber: { type: String },
  notes: { type: String },
  invoiceUrl: { type: String },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  refundedAt: { type: Date },
  refundAmount: { type: Number },
  refundReason: { type: String },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentReference: 1 });

module.exports = mongoose.model('Order', orderSchema);
