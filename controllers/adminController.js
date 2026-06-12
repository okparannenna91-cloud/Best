const crypto = require('crypto');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { generateSession, COOKIE_NAME } = require('../middleware/auth');

exports.login = (req, res, next) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (!password || !adminPassword) {
      return next(ApiError.notFound());
    }
    const pwBuf = Buffer.from(password);
    const adminBuf = Buffer.from(adminPassword);
    const valid = crypto.timingSafeEqual(
      Buffer.concat([pwBuf, Buffer.alloc(adminBuf.length - pwBuf.length)]),
      Buffer.concat([adminBuf, Buffer.alloc(pwBuf.length - adminBuf.length)])
    );
    if (!valid) {
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
    const [totalProducts, totalCategories, allProducts] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Product.countDocuments(),
    ]);

    ApiResponse.success(res, {
      totalProducts,
      totalCategories,
      totalAllProducts: allProducts,
    });
  } catch (error) {
    next(error);
  }
};
