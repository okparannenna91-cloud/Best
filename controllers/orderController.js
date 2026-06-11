const Order = require('../models/Order');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    ApiResponse.paginated(res, orders, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

exports.getOrderByPaymentRef = async (req, res, next) => {
  try {
    const order = await Order.findOne({ paymentReference: req.params.ref })
      .select('-shippingAddress -email -user -notes -couponCode -clerkId -refundAmount -refundReason');
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

exports.trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).select('status trackingNumber createdAt updatedAt');
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};
