const { Router } = require('express');
const { getActiveBanners } = require('../controllers/bannerController');

const router = Router();

router.get('/', getActiveBanners);

module.exports = router;
