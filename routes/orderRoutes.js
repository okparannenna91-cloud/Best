const { Router } = require('express');
const { getUserOrders, getOrderById, getOrderByPaymentRef, trackOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/track/:id', trackOrder);
router.get('/ref/:ref', getOrderByPaymentRef);
router.get('/:id', authenticate, getOrderById);
router.get('/', authenticate, getUserOrders);

module.exports = router;
