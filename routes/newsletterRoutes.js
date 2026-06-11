const { Router } = require('express');
const { body } = require('express-validator');
const { subscribe, unsubscribe } = require('../controllers/newsletterController');
const validate = require('../middleware/validate');

const router = Router();

router.post(
  '/subscribe',
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  subscribe
);

router.post('/unsubscribe/:token', unsubscribe);

module.exports = router;
