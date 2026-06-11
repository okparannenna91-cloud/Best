const Banner = require('../models/Banner');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAllBanners = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Banner.countDocuments();
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    ApiResponse.paginated(res, banners, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.createBanner = async (req, res, next) => {
  try {
    const { title, image, subtitle, description, mobileImage, link, buttonText, position, isActive, order, startDate, endDate } = req.body;
    if (!title || typeof title !== 'string') return next(ApiError.badRequest('Title is required'));
    if (!image || typeof image !== 'string') return next(ApiError.badRequest('Image is required'));
    const banner = await Banner.create({ title, image, subtitle, description, mobileImage, link, buttonText, position, isActive, order, startDate, endDate });
    ApiResponse.success(res, banner, 'Banner created', 201);
  } catch (error) {
    next(error);
  }
};

const BANNER_ALLOWED = ['title', 'image', 'subtitle', 'description', 'mobileImage', 'link', 'buttonText', 'position', 'isActive', 'order', 'startDate', 'endDate'];

exports.updateBanner = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of BANNER_ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!banner) return next(ApiError.notFound('Banner not found'));
    ApiResponse.success(res, banner, 'Banner updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return next(ApiError.notFound('Banner not found'));
    ApiResponse.success(res, null, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};
