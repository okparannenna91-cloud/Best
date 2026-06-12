const { Router } = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const adminRoutes = require('./adminRoutes');
const ApiResponse = require('../utils/ApiResponse');

const router = Router();

router.get('/banners', (req, res) => {
  ApiResponse.success(res, [], 'Banners fetched');
});

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
