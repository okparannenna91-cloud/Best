const { Router } = require('express');
const {
  getAllProducts,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
} = require('../controllers/productController');

const router = Router();

router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/related/:id', getRelatedProducts);
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);

module.exports = router;
