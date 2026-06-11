const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true },
  link: { type: String },
  linkText: { type: String },
  isActive: { type: Boolean, default: true },
  backgroundColor: { type: String, default: '#000' },
  textColor: { type: String, default: '#fff' },
}, { timestamps: true });

announcementSchema.index({ isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
