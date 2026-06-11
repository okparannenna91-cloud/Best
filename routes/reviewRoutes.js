const { Router } = require('express');
const { getProductReviews, getFeaturedReviews, createReview } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/featured', getFeaturedReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);

module.exports = router;
