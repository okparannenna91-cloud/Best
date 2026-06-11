const Coupon = require('../models/Coupon');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAllCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Coupon.countDocuments();
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    ApiResponse.paginated(res, coupons, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return next(ApiError.notFound('Coupon not found'));
    ApiResponse.success(res, coupon);
  } catch (error) {
    next(error);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, type, value, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      expiresAt,
    });
    ApiResponse.success(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const COUPON_ALLOWED = ['code', 'description', 'type', 'value', 'minOrderAmount', 'maxDiscount', 'usageLimit', 'expiresAt', 'isActive'];

exports.updateCoupon = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of COUPON_ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.code) updates.code = updates.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!coupon) return next(ApiError.notFound('Coupon not found'));
    ApiResponse.success(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return next(ApiError.notFound('Coupon not found'));
    ApiResponse.success(res, null, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return next(ApiError.notFound('Invalid coupon code'));
    if (new Date() > coupon.expiresAt) return next(ApiError.badRequest('Coupon has expired'));
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return next(ApiError.badRequest('Coupon usage limit reached'));
    if (orderTotal < coupon.minOrderAmount) return next(ApiError.badRequest(`Minimum order amount is ₦${coupon.minOrderAmount.toLocaleString()}`));

    let discount = coupon.type === 'percentage' ? (orderTotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    ApiResponse.success(res, { coupon, discount }, 'Coupon applied successfully');
  } catch (error) {
    next(error);
  }
};
