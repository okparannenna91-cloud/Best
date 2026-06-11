const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('addresses')
      .populate({ path: 'wishlist', populate: { path: 'products', model: 'Product' } });
    ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { email, orderUpdates, promotions } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return next(ApiError.notFound('User not found'));
    if (email !== undefined) user.notificationPreferences.email = email;
    if (orderUpdates !== undefined) user.notificationPreferences.orderUpdates = orderUpdates;
    if (promotions !== undefined) user.notificationPreferences.promotions = promotions;
    await user.save();
    ApiResponse.success(res, user.notificationPreferences, 'Preferences updated');
  } catch (error) {
    next(error);
  }
};
