const Announcement = require('../models/Announcement');
const ApiResponse = require('../utils/ApiResponse');

exports.getActiveAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({ isActive: true }).sort({ createdAt: -1 });
    ApiResponse.success(res, announcement || null, 'Announcement fetched');
  } catch (error) {
    next(error);
  }
};
