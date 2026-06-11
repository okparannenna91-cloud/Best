const FlashSale = require('../models/FlashSale');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAllFlashSales = async (req, res, next) => {
  try {
    const sales = await FlashSale.find().populate('products', 'name slug price images').sort({ createdAt: -1 });
    ApiResponse.success(res, sales);
  } catch (error) {
    next(error);
  }
};

exports.getFlashSaleById = async (req, res, next) => {
  try {
    const sale = await FlashSale.findById(req.params.id).populate('products', 'name slug price images stock');
    if (!sale) return next(ApiError.notFound('Flash sale not found'));
    ApiResponse.success(res, sale);
  } catch (error) {
    next(error);
  }
};

exports.createFlashSale = async (req, res, next) => {
  try {
    const { name, description, products, discountType, discountValue, startDate, endDate, bannerImage, isActive } = req.body;
    if (!name || !discountValue || !startDate || !endDate) {
      return next(ApiError.badRequest('Name, discount value, start date, and end date are required'));
    }
    const sale = await FlashSale.create({ name, description, products, discountType, discountValue, startDate, endDate, bannerImage, isActive });
    ApiResponse.success(res, sale, 'Flash sale created', 201);
  } catch (error) {
    next(error);
  }
};

const FLASH_SALE_ALLOWED = ['name', 'description', 'products', 'discountType', 'discountValue', 'startDate', 'endDate', 'bannerImage', 'isActive'];

exports.updateFlashSale = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of FLASH_SALE_ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const sale = await FlashSale.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!sale) return next(ApiError.notFound('Flash sale not found'));
    ApiResponse.success(res, sale, 'Flash sale updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteFlashSale = async (req, res, next) => {
  try {
    const sale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!sale) return next(ApiError.notFound('Flash sale not found'));
    ApiResponse.success(res, null, 'Flash sale deleted');
  } catch (error) {
    next(error);
  }
};
