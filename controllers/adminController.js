const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { generateSession, COOKIE_NAME } = require('../middleware/auth');

exports.login = (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return next(ApiError.notFound());
    }

    const token = generateSession();

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    ApiResponse.success(res, null, 'Authenticated');
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  ApiResponse.success(res, null, 'Logged out');
};

exports.checkSession = (req, res) => {
  ApiResponse.success(res, { authenticated: true });
};

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
