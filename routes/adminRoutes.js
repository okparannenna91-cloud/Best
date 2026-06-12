const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { login, logout, checkSession, getDashboardStats } = require('../controllers/adminController');
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
} = require('../controllers/adminProductController');
const {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} = require('../controllers/adminCategoryController');

const router = Router();

router.post('/login', login);
router.post('/logout', logout);

router.use(authenticate, requireAdmin);

router.get('/check', checkSession);
router.get('/dashboard', getDashboardStats);

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
