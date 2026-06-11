const Address = require('../models/Address');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    ApiResponse.success(res, addresses);
  } catch (error) {
    next(error);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      label,
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || 'Nigeria',
      isDefault: isDefault || false,
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { addresses: address._id } });
    ApiResponse.success(res, address, 'Address created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return next(ApiError.notFound('Address not found'));

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
    }

    Object.assign(address, req.body);
    await address.save();
    ApiResponse.success(res, address, 'Address updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return next(ApiError.notFound('Address not found'));
    await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: address._id } });
    ApiResponse.success(res, null, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};
