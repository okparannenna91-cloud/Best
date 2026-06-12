const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');

const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();

connectDB();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "https://img.clerk.com"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://clerk.sollene.site", "https://challenges.cloudflare.com"],
      scriptSrcAttr: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      upgradeInsecureRequests: [],
      connectSrc: ["'self'", "https://clerk.sollene.site", "https://*.clerk.com", "https://challenges.cloudflare.com"],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));

// Capture raw body before JSON parsing for webhook HMAC verification
app.use((req, res, next) => {
  if (req.path === '/api/checkout/webhook' || req.path === '/api/auth/clerk-webhook') {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      req.rawBody = data;
      try { req.body = JSON.parse(data); } catch (_) {}
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection via SameSite cookie policy
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PAYSTACK_IPS = [
  '52.31.139.75', '52.49.173.169', '52.214.14.220',
  '35.176.93.186', '35.177.124.156', '35.177.125.220',
];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', (req, res, next) => {
  if (req.path === '/checkout/webhook') return next();
  limiter(req, res, next);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SOLLENE API is running' });
});

app.get('/api/config', (req, res) => {
  res.json({
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    taxRate: parseFloat(process.env.TAX_RATE || '0.075'),
    shippingThreshold: parseFloat(process.env.SHIPPING_THRESHOLD || '50000'),
    shippingCost: parseFloat(process.env.SHIPPING_COST || '3500'),
  });
});

app.post('/api/analytics/pageview', (req, res) => {
  const { page, referrer } = req.body || {};
  if (page) console.log(`[Analytics] Page view: ${page} | Referrer: ${referrer || 'direct'}`);
  res.json({ ok: true });
});

app.use('/api', routes);

app.get('/product/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/order/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-detail.html'));
});

// Static pages
const staticPages = {
  '/shop': 'shop.html',
  '/categories': 'categories.html',
  '/track-order': 'track-order.html',
  '/contact': 'contact.html',
  '/about': 'about.html',
  '/privacy-policy': 'privacy.html',
  '/terms': 'terms.html',
  '/return-policy': 'returns.html',
  '/shipping-policy': 'shipping.html',
  '/best-sellers': 'shop.html',
  '/new-arrivals': 'shop.html',
  '/sale': 'shop.html',
  '/faq': 'index.html',
};
for (const [route, file] of Object.entries(staticPages)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
}

app.get('/sign-in', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sign-in.html'));
});

app.get('/sign-up', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sign-up.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});
app.get('/account/*path', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin/*path', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});
app.get('/offline', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'offline.html'));
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SOLLENE server running on port ${PORT}`);
});

module.exports = app;
