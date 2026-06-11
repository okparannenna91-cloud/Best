const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { initializePayment, verifyPayment, webhook } = require('../controllers/paystackController');
const { createOrder, verifyCheckout } = require('../controllers/checkoutController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = Router();

router.post('/initialize', optionalAuth, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
], validate, initializePayment);

router.get('/verify/:reference', verifyPayment);
router.post('/webhook', webhook);

router.post('/create', optionalAuth, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
], validate, createOrder);

router.get('/order/:reference', verifyCheckout);

module.exports = router;
