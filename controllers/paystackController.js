const axios = require('axios');
const crypto = require('crypto');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

const PAYSTACK_IPS = [
  '52.31.139.75', '52.49.173.169', '52.214.14.220',
  '35.176.93.186', '35.177.124.156', '35.177.125.220',
];

const paystack = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
});

async function processPaidOrder(order) {
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, soldCount: item.quantity } });
  }
}

exports.initializePayment = async (req, res, next) => {
  try {
    const { email, amount, reference, metadata } = req.body;
    if (!email || !amount) return next(ApiError.badRequest('Email and amount are required'));

    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100),
      reference: reference || `SOLLENE_${Date.now()}_${Math.random().toString(36).slice(2,8).toUpperCase()}`,
      callback_url: `${process.env.FRONTEND_URL || 'https://sollene.site'}/checkout/verify`,
      metadata: { ...metadata, customer_email: email },
    });

    ApiResponse.success(res, response.data.data, 'Payment initialized');
  } catch (error) {
    if (error.response) return next(ApiError.badRequest(error.response.data.message || 'Paystack initialization failed'));
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    if (!reference) return next(ApiError.badRequest('Payment reference is required'));

    const response = await paystack.get(`/transaction/verify/${reference}`);
    const data = response.data.data;

    if (data.status === 'success') {
      const order = await Order.findOne({ paymentReference: reference });
      if (order && order.paymentStatus !== 'success') {
        order.paymentStatus = 'success';
        order.status = 'Paid';
        order.paidAt = new Date();
        await order.save();
        await processPaidOrder(order);
      }
    }

    ApiResponse.success(res, data, 'Payment verified');
  } catch (error) {
    if (error.response) return next(ApiError.badRequest(error.response.data.message || 'Verification failed'));
    next(error);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(401).json({ status: 'invalid signature' });

    const event = req.body;
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const order = await Order.findOne({ paymentReference: reference });

      if (order && order.paymentStatus !== 'success') {
        order.paymentStatus = 'success';
        order.status = 'Paid';
        order.paidAt = new Date();
        await order.save();
        await processPaidOrder(order);
        try {
          const emailService = require('../config/email');
          const user = order.user ? await User.findById(order.user) : null;
          await emailService.sendPaymentConfirmation(order.email, user?.firstName, order);
          await emailService.sendOrderConfirmation(order.email, user?.firstName, order);
        } catch (emailErr) {
          console.error('Email send error after webhook:', emailErr.message);
        }
      }
    }

    if (event.event === 'charge.failed') {
      const order = await Order.findOne({ paymentReference: event.data.reference });
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
      }
    }

    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(200).json({ status: 'received' });
  }
};
