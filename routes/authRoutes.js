const { Router } = require('express');
const { clerkWebhook } = require('../controllers/authController');

const router = Router();

router.post('/clerk-webhook', clerkWebhook);

module.exports = router;
