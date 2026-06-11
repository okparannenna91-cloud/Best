const { Router } = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const bannerRoutes = require('./bannerRoutes');
const reviewRoutes = require('./reviewRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const flashSaleRoutes = require('./flashSaleRoutes');
const announcementRoutes = require('./announcementRoutes');

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/banners', bannerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;
