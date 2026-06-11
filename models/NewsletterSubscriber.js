const mongoose = require('mongoose');
const crypto = require('crypto');

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  token: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
}, { timestamps: true });

newsletterSubscriberSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(24).toString('hex');
  }
  next();
});

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
