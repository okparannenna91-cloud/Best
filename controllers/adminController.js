const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOrders,
      totalRevenue,
      monthOrders,
      monthRevenue,
      yearRevenue,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      ordersByStatus,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ isAdmin: { $ne: true } }),
      Product.countDocuments({ stock: { $lte: 5, $gt: 0 } }),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'firstName lastName email'),
    ]);

    ApiResponse.success(res, {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
      yearRevenue: yearRevenue[0]?.total || 0,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      ordersByStatus: ordersByStatus.reduce((acc, o) => ({ ...acc, [o._id]: o.count }), {}),
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const months = 6;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      data.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: result[0]?.total || 0,
      });
    }
    ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
};
