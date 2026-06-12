const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('trust proxy', 1);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
function serveAdminHtml(req, res) {
  const filePath = path.join(__dirname, 'public', 'admin.html');
  let html = fs.readFileSync(filePath, 'utf-8');
  html = html.replace('{{ADMIN_CONFIGURED}}', ADMIN_PASSWORD ? 'true' : 'false');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.type('html').send(html);
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

app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.path === '/config') return next();
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ success: false, message: 'Database connection unavailable' });
  }
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

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SOLLENE server running on port ${PORT}`);
});

module.exports = app;
