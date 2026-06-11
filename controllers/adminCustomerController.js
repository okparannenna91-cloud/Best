const User = require('../models/User');
const Order = require('../models/Order');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { isAdmin: { $ne: true } };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const customersWithOrders = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ user: c._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: c._id, status: { $nin: ['Cancelled', 'Refunded'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        return { ...c.toObject(), orderCount, totalSpent: totalSpent[0]?.total || 0 };
      })
    );

    ApiResponse.paginated(res, customersWithOrders, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('addresses');
    if (!user) return next(ApiError.notFound('Customer not found'));

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    const totalSpent = orders
      .filter((o) => !['Cancelled', 'Refunded'].includes(o.status))
      .reduce((s, o) => s + o.total, 0);

    ApiResponse.success(res, { user, orders, totalSpent });
  } catch (error) {
    next(error);
  }
};
