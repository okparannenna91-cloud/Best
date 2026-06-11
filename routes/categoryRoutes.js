const { Router } = require('express');
const { getAllCategories, getCategoryBySlug } = require('../controllers/categoryController');

const router = Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
