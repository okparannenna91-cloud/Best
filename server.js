const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
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
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://clerk.sollene.site", "https://challenges.cloudflare.com", "'unsafe-inline'"],
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

// Capture raw body for Clerk webhook
app.use((req, res, next) => {
  if (req.path === '/api/auth/clerk-webhook') {
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

const ADMIN_USER_ID = process.env.CLERK_ADMIN_USER_ID || '';
function serveAdminHtml(req, res) {
  const filePath = path.join(__dirname, 'public', 'admin.html');
  const html = fs.readFileSync(filePath, 'utf-8');
  const injected = html
    .replace("{{CLERK_PUBLISHABLE_KEY}}", process.env.CLERK_PUBLISHABLE_KEY || '')
    .replace("{{ADMIN_USER_ID}}", ADMIN_USER_ID);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.type('html').send(injected);
}
app.get('/admin', serveAdminHtml);
app.get('/admin/*path', serveAdminHtml);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', (req, res, next) => {
  limiter(req, res, next);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SOLLENE API is running' });
});

app.get('/api/config', (req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER || '2348000000000',
  });
});

app.use('/api', routes);

app.get('/product/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Static pages
const staticPages = {
  '/shop': 'shop.html',
  '/categories': 'categories.html',
  '/contact': 'contact.html',
  '/about': 'about.html',
  '/privacy-policy': 'privacy.html',
  '/terms': 'terms.html',
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
