const { Router } = require('express');
const { getActiveFlashSales } = require('../controllers/flashSaleController');

const router = Router();

router.get('/', getActiveFlashSales);

module.exports = router;
