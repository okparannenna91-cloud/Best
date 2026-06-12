const { Router } = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
