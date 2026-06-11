const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  avatar: { type: String },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
  wishlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' },
  isAdmin: { type: Boolean, default: false },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
