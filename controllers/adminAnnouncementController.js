const Announcement = require('../models/Announcement');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    ApiResponse.success(res, announcements);
  } catch (error) {
    next(error);
  }
};

exports.getAnnouncementById = async (req, res, next) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return next(ApiError.notFound('Announcement not found'));
    ApiResponse.success(res, a);
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { text, link, linkText, isActive, backgroundColor, textColor } = req.body;
    if (!text) return next(ApiError.badRequest('Announcement text is required'));
    const a = await Announcement.create({ text, link, linkText, isActive, backgroundColor, textColor });
    ApiResponse.success(res, a, 'Announcement created', 201);
  } catch (error) {
    next(error);
  }
};

const ANNOUNCEMENT_ALLOWED = ['text', 'link', 'linkText', 'isActive', 'backgroundColor', 'textColor'];

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ANNOUNCEMENT_ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const a = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!a) return next(ApiError.notFound('Announcement not found'));
    ApiResponse.success(res, a, 'Announcement updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const a = await Announcement.findByIdAndDelete(req.params.id);
    if (!a) return next(ApiError.notFound('Announcement not found'));
    ApiResponse.success(res, null, 'Announcement deleted');
  } catch (error) {
    next(error);
  }
};
