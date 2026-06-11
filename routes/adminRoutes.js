const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getDashboardStats, getRevenueChart } = require('../controllers/adminController');
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkUpdateStock,
} = require('../controllers/adminProductController');
const {
  getAllOrders, getOrderById, updateOrderStatus, deleteOrder,
} = require('../controllers/adminOrderController');
const {
  getAllCustomers, getCustomerById,
} = require('../controllers/adminCustomerController');
const {
  getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, validateCoupon,
} = require('../controllers/adminCouponController');
const {
  getAllBanners, createBanner, updateBanner, deleteBanner,
} = require('../controllers/adminBannerController');
const {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} = require('../controllers/adminCategoryController');
const {
  getAllFlashSales, getFlashSaleById, createFlashSale, updateFlashSale, deleteFlashSale,
} = require('../controllers/adminFlashSaleController');
const {
  getAllAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} = require('../controllers/adminAnnouncementController');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/dashboard/revenue', getRevenueChart);

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk-stock', bulkUpdateStock);

router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);

router.get('/coupons', getAllCoupons);
router.get('/coupons/:id', getCouponById);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.post('/coupons/validate', validateCoupon);

router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/banners', getAllBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

router.get('/flash-sales', getAllFlashSales);
router.get('/flash-sales/:id', getFlashSaleById);
router.post('/flash-sales', createFlashSale);
router.put('/flash-sales/:id', updateFlashSale);
router.delete('/flash-sales/:id', deleteFlashSale);

router.get('/announcements', getAllAnnouncements);
router.get('/announcements/:id', getAnnouncementById);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
