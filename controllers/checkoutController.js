const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const emailService = require('../config/email');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, notes } = req.body;
    if (!items?.length) return next(ApiError.badRequest('Cart is empty'));
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state) {
      return next(ApiError.badRequest('Shipping address is required'));
    }

    const productIds = items.map(i => i._id);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    if (products.length !== items.length) return next(ApiError.badRequest('Some products are unavailable'));

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = productMap[item._id];
      if (!product) return next(ApiError.notFound(`Product ${item._id} not found`));
      if (product.stock < item.quantity) return next(ApiError.badRequest(`Insufficient stock for ${product.name}`));
      const price = item.variant ? (product.variants.find(v => v.name === item.variant)?.price || product.price) : product.price;
      subtotal += price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        price,
        quantity: item.quantity,
        variant: item.variant || '',
        sku: item.sku || product.sku,
      });
    }

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) return next(ApiError.notFound('Invalid coupon code'));
      if (new Date() > coupon.expiresAt) return next(ApiError.badRequest('Coupon has expired'));
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return next(ApiError.badRequest('Coupon usage limit reached'));
      if (subtotal < coupon.minOrderAmount) return next(ApiError.badRequest(`Minimum order amount is ₦${coupon.minOrderAmount.toLocaleString()}`));
      discount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      appliedCoupon = coupon;
    }

    const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.075');
    const SHIPPING_THRESHOLD = parseFloat(process.env.SHIPPING_THRESHOLD || '50000');
    const SHIPPING_COST = parseFloat(process.env.SHIPPING_COST || '3500');
    const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const tax = Math.round((subtotal - discount) * TAX_RATE);
    const total = subtotal - discount + tax + shippingCost;

    const paymentRef = `SOLLENE_${Date.now()}_${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const order = await Order.create({
      user: req.user?._id || null,
      clerkId: req.clerkUserId || null,
      email: req.user?.email || shippingAddress.email || '',
      items: orderItems,
      shippingAddress: { ...shippingAddress, country: shippingAddress.country || 'Nigeria' },
      shippingCost,
      subtotal,
      tax,
      discount,
      couponCode: couponCode || undefined,
      total: Math.round(total),
      paymentReference: paymentRef,
      notes: notes || '',
    });

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

    try {
      await emailService.sendOrderConfirmation(order.email, req.user?.firstName, order);
    } catch (emailErr) {
      console.error('Order confirmation email error:', emailErr.message);
    }

    ApiResponse.success(res, {
      order,
      paymentReference: paymentRef,
      amount: Math.round(total),
    }, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.verifyCheckout = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const order = await Order.findOne({ paymentReference: reference })
      .select('-shippingAddress -email -user -notes -couponCode -clerkId -refundAmount -refundReason')
      .populate('items.product', 'name images price slug');
    if (!order) return next(ApiError.notFound('Order not found'));
    ApiResponse.success(res, order, 'Order retrieved');
  } catch (error) {
    next(error);
  }
};
