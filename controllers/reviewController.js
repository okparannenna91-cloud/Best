const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ product: req.params.productId, isActive: true });
    const reviews = await Review.find({ product: req.params.productId, isActive: true })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    ApiResponse.paginated(res, reviews, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isActive: true, rating: { $gte: 4 } })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(6);
    ApiResponse.success(res, reviews, 'Featured reviews fetched successfully');
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { product: productId, rating, title, comment } = req.body;

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return next(ApiError.badRequest('You have already reviewed this product'));

    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: { $in: ['Delivered', 'Paid'] },
    });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      title,
      comment,
      isVerifiedPurchase: !!order,
    });

    const stats = await Review.aggregate([
      { $match: { product: review.product, isActive: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length) {
      await Product.findByIdAndUpdate(review.product, {
        ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
        ratingsCount: stats[0].count,
      });
    }

    ApiResponse.success(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};
