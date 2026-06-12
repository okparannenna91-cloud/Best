const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalProducts, totalCategories] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
    ]);

    ApiResponse.success(res, {
      totalProducts,
      totalCategories,
    });
  } catch (error) {
    next(error);
  }
};
