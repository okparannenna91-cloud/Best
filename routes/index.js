const { Router } = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const adminRoutes = require('./adminRoutes');
const ApiResponse = require('../utils/ApiResponse');

const router = Router();

router.get('/banners', (req, res) => {
  ApiResponse.success(res, [], 'Banners fetched');
});

router.get('/announcements', (req, res) => {
  ApiResponse.success(res, null, 'No active announcements');
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }
  console.log('Contact form submission:', { name, email, message });
  ApiResponse.success(res, null, 'Message received. We will get back to you shortly.');
});

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
