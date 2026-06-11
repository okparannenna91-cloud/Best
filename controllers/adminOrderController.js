const Order = require('../models/Order');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const emailService = require('../config/email');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
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
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, order);
  } catch (error) {
    next(error);
  }
};

const VALID_STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, notes, refundAmount, refundReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(ApiError.notFound('Order not found'));

    if (status && !VALID_STATUSES.includes(status)) {
      return next(ApiError.badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
    }

    const prevStatus = order.status;
    if (status) order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;
    if (refundAmount !== undefined) {
      if (typeof refundAmount !== 'number' || refundAmount < 0) return next(ApiError.badRequest('Refund amount must be a non-negative number'));
      order.refundAmount = refundAmount;
    }
    if (refundReason !== undefined) {
      if (typeof refundReason !== 'string') return next(ApiError.badRequest('Refund reason must be a string'));
      order.refundReason = refundReason;
    }

    if (status === 'Paid') order.paidAt = new Date();
    if (status === 'Delivered') order.deliveredAt = new Date();
    if (status === 'Cancelled') order.cancelledAt = new Date();
    if (status === 'Refunded') order.refundedAt = new Date();

    await order.save();

    if (status && status !== prevStatus) {
      const user = order.user ? await User.findById(order.user) : null;
      const firstName = user?.firstName || order.shippingAddress?.fullName?.split(' ')[0] || 'Customer';
      if (status === 'Shipped') {
        emailService.sendShippingUpdate(order.email, firstName, order).catch(err => console.error('Shipping email error:', err.message));
      } else if (status === 'Delivered') {
        emailService.sendDeliveryNotification(order.email, firstName, order).catch(err => console.error('Delivery email error:', err.message));
      }
    }

    ApiResponse.success(res, order, 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, null, 'Order deleted');
  } catch (error) {
    next(error);
  }
};
