const FlashSale = require('../models/FlashSale');
const ApiResponse = require('../utils/ApiResponse');

exports.getActiveFlashSales = async (req, res, next) => {
  try {
    const now = new Date();
    const sales = await FlashSale.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('products', 'name slug price images stock isActive').sort({ createdAt: -1 });
    ApiResponse.success(res, sales, 'Active flash sales fetched');
  } catch (error) {
    next(error);
  }
};
