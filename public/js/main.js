/* ============================
   SOLLENE — Main JavaScript
   Elevating Everyday Living
   ============================ */

// --- Utility ---
const API_BASE = '/api';
const formatPrice = (n) => '₦' + Number(n).toLocaleString('en-US');
const getCart = () => JSON.parse(localStorage.getItem('sollene_cart') || '[]');
const setCart = (cart) => {
  localStorage.setItem('sollene_cart', JSON.stringify(cart));
  updateCartBadge();
};
const updateCartBadge = () => {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
};

// --- Cart ---
function renderCartDrawer() {
  const cart = getCart();
  const emptyEl = document.getElementById('cartEmpty');
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (!itemsEl) return;

  if (cart.length === 0) {
    emptyEl?.classList.remove('hidden');
    itemsEl.classList.add('hidden');
    footerEl?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  itemsEl.classList.remove('hidden');
  footerEl?.classList.remove('hidden');

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image || ''}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button onclick="updateCartQty(${idx}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartQty(${idx}, ${item.quantity + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${idx})">Remove</button>
          <button class="cart-item-remove" onclick="saveForLater(${idx})" style="color:var(--color-gray-400);font-size:0.75rem">Save for later</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 50000 ? 0 : 3500;
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax + shipping;
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartTax').textContent = formatPrice(tax);
  document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  document.getElementById('cartTotal').textContent = formatPrice(total);
  const shippingNote = document.getElementById('cartShippingNote');
  if (shippingNote) shippingNote.textContent = shipping > 0 ? `Free shipping on orders over ₦50,000 (add ₦${(50000 - subtotal).toLocaleString()} more)` : 'Your order qualifies for free shipping!';
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((i) => i._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: 1,
    });
  }
  setCart(cart);
  renderCartDrawer();
  openCart();
}

window.updateCartQty = function (idx, qty) {
  const cart = getCart();
  if (qty <= 0) return cart.splice(idx, 1);
  cart[idx].quantity = qty;
  setCart(cart);
  renderCartDrawer();
};

window.removeFromCart = function (idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  setCart(cart);
  renderCartDrawer();
};

window.saveForLater = function (idx) {
  const cart = getCart();
  const item = cart[idx];
  if (!item) return;
  let saved = JSON.parse(localStorage.getItem('sollene_saved_later') || '[]');
  saved.push(item);
  localStorage.setItem('sollene_saved_later', JSON.stringify(saved));
  cart.splice(idx, 1);
  setCart(cart);
  renderCartDrawer();
};

// --- Cart Drawer Toggle ---
function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

// --- Load saved-for-later ---
function loadSavedLater() {
  const saved = JSON.parse(localStorage.getItem('sollene_saved_later') || '[]');
  if (!saved.length) return;
  saved.forEach(item => {
    const cart = getCart();
    if (!cart.find(i => i._id === item._id)) {
      cart.push(item);
      setCart(cart);
    }
  });
  localStorage.removeItem('sollene_saved_later');
}

// --- Wishlist ---
function toggleWishlist(productId, btn) {
  let wishlist = JSON.parse(localStorage.getItem('sollene_wishlist') || '[]');
  const idx = wishlist.indexOf(productId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    btn?.classList.remove('in-wishlist');
  } else {
    wishlist.push(productId);
    btn?.classList.add('in-wishlist');
  }
  localStorage.setItem('sollene_wishlist', JSON.stringify(wishlist));
  const badge = document.getElementById('wishlistBadge');
  if (badge) badge.textContent = wishlist.length;
}

window.moveWishlistToCart = function (productId, name, price, image) {
  const cart = getCart();
  const existing = cart.find(i => i._id === productId);
  if (existing) { existing.quantity += 1; }
  else { cart.push({ _id: productId, name, price, image: image || '', quantity: 1 }); }
  setCart(cart);
  let wishlist = JSON.parse(localStorage.getItem('sollene_wishlist') || '[]');
  wishlist = wishlist.filter(id => id !== productId);
  localStorage.setItem('sollene_wishlist', JSON.stringify(wishlist));
  openCart();
};

// --- API Calls ---
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API fetch failed: ${endpoint}`, err);
    return null;
  }
}

async function loadFeaturedProducts() {
  const data = await fetchAPI('/products/featured');
  if (!data?.data) return;
  renderProducts('featuredProducts', data.data);
}

async function loadNewArrivals() {
  const data = await fetchAPI('/products/new-arrivals');
  if (!data?.data) return;
  renderProducts('newArrivals', data.data);
}

async function loadBestSellers() {
  const data = await fetchAPI('/products/best-sellers');
  if (!data?.data) return;
  renderProducts('bestSellers', data.data);
}

async function loadCategories() {
  const data = await fetchAPI('/categories');
  if (!data?.data) return;
  renderCategories(data.data);
}

async function loadHeroBanners() {
  const data = await fetchAPI('/banners');
  if (!data?.data || data.data.length === 0) {
    renderDefaultHero();
    return;
  }
  renderHeroSlides(data.data);
}

async function loadReviews() {
  const data = await fetchAPI('/reviews/featured');
  if (!data?.data || data.data.length === 0) {
    renderDefaultReviews();
    return;
  }
  renderReviews(data.data);
}

// --- Render Helpers ---
function renderProducts(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = products.map((p) => {
    const stars = Math.round(p.ratingsAverage || 0);
    const starHTML = Array.from({ length: 5 }, (_, i) =>
      `<span class="star">${i < stars ? '★' : '☆'}</span>`
    ).join('');

    return `
      <div class="product-card fade-in" data-product-id="${p._id}" onclick="window.location='/product/${p.slug}'">
        <div class="product-card-image">
          <img src="${p.images?.[0] || ''}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
          ${p.comparePrice ? `<span class="product-badge" style="left:auto;right:12px;background:var(--color-white);color:var(--color-black);">${Math.round((1 - p.price / p.comparePrice) * 100)}% OFF</span>` : ''}
          <div class="product-card-actions">
            <button onclick="event.stopPropagation();addToCart(${JSON.stringify({ _id: p._id, name: p.name, price: p.price, images: p.images })});return false;" title="Add to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </button>
            <button onclick="event.stopPropagation();toggleWishlist('${p._id}', this);return false;" title="Add to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${p.category?.name || ''}</span>
          <span class="product-card-name">${p.name}</span>
          <div class="product-card-rating">
            <span class="stars">${starHTML}</span>
            <span>(${p.ratingsCount || 0})</span>
          </div>
          <span class="product-card-price" data-original-price="${p.price}">
            ${formatPrice(p.price)}
            ${p.comparePrice ? `<span class="compare-price">${formatPrice(p.comparePrice)}</span>` : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderCategories(categories) {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = categories.map((cat) => `
    <a href="/shop?category=${cat._id}" class="category-card fade-in">
      <img src="${cat.image || ''}" alt="${cat.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="category-card-overlay"></div>
      <span class="category-card-title">${cat.name}</span>
    </a>
  `).join('');
}

function renderHeroSlides(banners) {
  const slider = document.getElementById('heroSlider');
  const dots = document.getElementById('heroDots');
  if (!slider) return;

  slider.innerHTML = banners.map((b, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}">
      <div class="hero-slide-bg" style="background-image:url('${b.image}')"></div>
      <div class="hero-content">
        ${b.title ? `<div class="hero-tag">${b.subtitle || 'Featured'}</div>` : ''}
        <h1 class="hero-title">${b.title || 'SOLLENE'}</h1>
        <p class="hero-text">${b.description || 'Elevating Everyday Living'}</p>
        ${b.link ? `<a href="${b.link}" class="btn btn-outline" style="border-color:white;color:white;">${b.buttonText || 'Shop Now'}</a>` :
          `<a href="/shop" class="btn btn-outline" style="border-color:white;color:white;">Shop Now</a>`}
      </div>
    </div>
  `).join('');

  dots.innerHTML = banners.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
  ).join('');

  initHeroSlider(banners.length);
}

function renderDefaultHero() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;

  slider.innerHTML = `
    <div class="hero-slide active">
      <div class="hero-slide-bg" style="background:linear-gradient(135deg, #000 0%, #1a1a1a 100%);"></div>
      <div class="hero-content">
        <div class="hero-tag">Premium Lifestyle</div>
        <h1 class="hero-title">Elevating Everyday Living</h1>
        <p class="hero-text">Discover our curated collection of premium household items, clothing, and personal care products designed for modern living.</p>
        <a href="/shop" class="btn btn-outline" style="border-color:white;color:white;">Shop Now</a>
      </div>
    </div>
    <div class="hero-slide">
      <div class="hero-slide-bg" style="background:linear-gradient(135deg, #111 0%, #000 100%);"></div>
      <div class="hero-content">
        <div class="hero-tag">New Collection</div>
        <h1 class="hero-title">Essentials Reimagined</h1>
        <p class="hero-text">Quality meets design. Explore our latest arrivals in clothing and personal care.</p>
        <a href="/new-arrivals" class="btn btn-outline" style="border-color:white;color:white;">Explore Now</a>
      </div>
    </div>
  `;

  document.getElementById('heroDots').innerHTML = `
    <button class="hero-dot active" data-index="0"></button>
    <button class="hero-dot" data-index="1"></button>
  `;

  initHeroSlider(2);
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsSlider');
  if (!container) return;

  container.innerHTML = reviews.map((r) => `
    <div class="review-card fade-in">
      <div class="review-stars">
        ${Array.from({ length: 5 }, (_, i) => `<span>${i < r.rating ? '★' : '☆'}</span>`).join('')}
      </div>
      <p class="review-text">"${r.comment || 'Amazing quality and fast delivery!'}"</p>
      <div class="review-author">
        <div class="review-avatar">
          ${r.user?.avatar ? `<img src="${r.user.avatar}" alt="${r.user.firstName || 'Customer'}">` : ''}
        </div>
        <div>
          <div class="review-name">${r.user?.firstName || 'Verified'} ${r.user?.lastName || 'Customer'}</div>
          ${r.isVerifiedPurchase ? '<div class="review-verified">Verified Purchase</div>' : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function renderDefaultReviews() {
  const container = document.getElementById('reviewsSlider');
  if (!container) return;

  const defaultReviews = [
    { name: 'Chioma O.', rating: 5, text: 'Absolutely love the quality of their products. The delivery was fast and packaging was premium.' },
    { name: 'Emeka N.', rating: 5, text: 'SOLLENE has become my go-to for personal care. The deodorants are simply amazing.' },
    { name: 'Amina S.', rating: 4, text: 'Great customer service and beautiful products. Will definitely be ordering again.' },
  ];

  container.innerHTML = defaultReviews.map((r) => `
    <div class="review-card fade-in">
      <div class="review-stars">
        ${Array.from({ length: 5 }, (_, i) => `<span>${i < r.rating ? '★' : '☆'}</span>`).join('')}
      </div>
      <p class="review-text">"${r.text}"</p>
      <div class="review-author">
        <div class="review-avatar"></div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-verified">Verified Purchase</div>
        </div>
      </div>
    </div>
  `).join('');
}

// --- Hero Slider ---
function initHeroSlider(count) {
  let current = 0;
  let interval;

  const slides = () => document.querySelectorAll('.hero-slide');
  const dots = () => document.querySelectorAll('.hero-dot');

  function goTo(index) {
    slides().forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    dots().forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    current = index;
  }

  function next() { goTo((current + 1) % count); }
  function prev() { goTo((current - 1 + count) % count); }

  function startAuto() { interval = setInterval(next, 5000); }
  function stopAuto() { clearInterval(interval); }

  document.getElementById('heroNext')?.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  document.getElementById('heroPrev')?.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  document.getElementById('heroDots')?.addEventListener('click', (e) => {
    const dot = e.target.closest('.hero-dot');
    if (!dot) return;
    stopAuto();
    goTo(Number(dot.dataset.index));
    startAuto();
  });

  startAuto();
}

// --- FAQ Accordion ---
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('open');
    });
  });
}

// --- Scroll Effects ---
function initScrollEffects() {
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (header) {
      header.classList.toggle('scrolled', scrollY > 50);
    }

    if (backToTop) {
      backToTop.classList.toggle('visible', scrollY > 400);
    }
  }, { passive: true });
}

// --- Newsletter ---
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const success = document.getElementById('newsletterSuccess');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;

    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        form.classList.add('hidden');
        success?.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
    }
  });
}

// --- Search ---
function initSearch() {
  const toggle = document.getElementById('searchToggle');
  const overlay = document.getElementById('searchOverlay');
  const close = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  const suggestions = document.getElementById('searchSuggestions');

  toggle?.addEventListener('click', () => {
    overlay?.classList.add('open');
    setTimeout(() => input?.focus(), 300);
    document.body.style.overflow = 'hidden';
  });

  const closeSearch = () => {
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
    if (suggestions) suggestions.innerHTML = '';
  };

  close?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  document.querySelectorAll('.popular-tag').forEach((tag) => {
    tag.addEventListener('click', () => {
      input.value = tag.textContent;
      window.location = `/shop?search=${encodeURIComponent(tag.textContent)}`;
    });
  });

  let searchTimeout;
  input?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (q.length < 2) { suggestions.innerHTML = ''; return; }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}&limit=5`);
        const d = await res.json();
        if (d.success && d.data?.length) {
          suggestions.innerHTML = d.data.map(p => `<div class="search-suggestion-item" onclick="window.location='/product/${p.slug}'">
            <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--color-gray-50)">
              ${p.images?.[0] ? '<img src="'+p.images[0]+'" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.style.display=\'none\'">' : ''}
              <div><div style="font-size:0.85rem;font-weight:500">${p.name}</div><div style="font-size:0.8rem;color:var(--color-gray-400)">${formatPrice(p.price)}</div></div>
            </div></div>`).join('');
        } else {
          suggestions.innerHTML = '<div style="padding:12px;font-size:0.85rem;color:var(--color-gray-400)">No products found</div>';
        }
      } catch (_) { suggestions.innerHTML = ''; }
    }, 300);
  });
}

// --- Mobile Menu ---
function initMobileMenu() {
  const openBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('mobileClose');
  const overlay = document.getElementById('mobileOverlay');
  const menu = document.getElementById('mobileMenu');

  const open = () => {
    overlay?.classList.add('open');
    menu?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    overlay?.classList.remove('open');
    menu?.classList.remove('open');
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
}

// --- Cart Drawer Init ---
function initCartDrawer() {
  document.getElementById('cartToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderCartDrawer();
    openCart();
  });

  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
}

// --- User Menu ---
function initUserMenu() {
  const btn = document.getElementById('userMenuBtn');
  const dropdown = document.getElementById('userDropdown');

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('show');
  });

  document.addEventListener('click', () => dropdown?.classList.remove('show'));
}

// --- Announcement Bar ---
async function initAnnouncement() {
  const bar = document.getElementById('announcementBar');
  if (!bar) return;

  if (localStorage.getItem('sollene_announcement_closed')) {
    bar.remove();
    return;
  }

  try {
    const res = await fetch('/api/announcements');
    const d = await res.json();
    if (d.success && d.data) {
      const a = d.data;
      bar.style.display = 'block';
      bar.style.background = a.backgroundColor || '#000';
      bar.style.color = a.textColor || '#fff';
      bar.innerHTML = `<div class="announcement-content">
        <span class="announcement-text">${a.text}${a.link ? ' <a href="'+a.link+'" style="color:inherit;text-decoration:underline">'+ (a.linkText||'Learn More') +'</a>' : ''}</span>
        <button class="announcement-close" aria-label="Close announcement">&times;</button>
      </div>`;
      bar.querySelector('.announcement-close')?.addEventListener('click', () => {
        bar.remove();
        localStorage.setItem('sollene_announcement_closed', 'true');
      });
    }
  } catch (e) {
    console.warn('Announcement load failed:', e);
  }
}

// --- Flash Sales ---
let activeFlashSales = [];

async function initFlashSales() {
  try {
    const res = await fetch('/api/flash-sales');
    const d = await res.json();
    if (d.success && d.data?.length) {
      activeFlashSales = d.data;
      applyFlashSaleBadges();
    }
  } catch (e) {
    console.warn('Flash sale load failed:', e);
  }
}

function applyFlashSaleBadges() {
  document.querySelectorAll('.product-card').forEach(card => {
    const pid = card.dataset?.productId || card.querySelector('[data-product-id]')?.dataset?.productId;
    if (!pid) return;
    for (const sale of activeFlashSales) {
      if (sale.products?.some(p => (p._id || p) === pid)) {
        const badge = card.querySelector('.product-badge');
        const priceEl = card.querySelector('.product-price');
        if (badge && !badge.textContent.includes('SALE')) {
          badge.textContent = 'SALE';
          badge.style.background = '#dc2626';
        }
        if (priceEl && sale.discountType) {
          const currentPrice = parseInt(priceEl.dataset?.originalPrice || priceEl.textContent.replace(/[₦,]/g,''));
          if (currentPrice) {
            const salePrice = sale.discountType === 'percentage'
              ? currentPrice - (currentPrice * sale.discountValue / 100)
              : currentPrice - sale.discountValue;
            priceEl.innerHTML = `₦${Math.round(salePrice).toLocaleString()} <span style="text-decoration:line-through;color:var(--color-gray-400);font-size:0.75rem">₦${currentPrice.toLocaleString()}</span>`;
          }
        }
        break;
      }
    }
  });
}

// --- Cookie Consent ---
function initCookieConsent() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  if (localStorage.getItem('sollene_cookie_consent')) {
    banner.remove();
    return;
  }

  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('sollene_cookie_consent', 'accepted');
    banner.remove();
  });

  document.getElementById('cookieDecline')?.addEventListener('click', () => {
    localStorage.setItem('sollene_cookie_consent', 'declined');
    banner.remove();
  });
}

// --- Category Dropdown ---
async function loadCategoryDropdown() {
  const dropdown = document.getElementById('categoryDropdown');
  if (!dropdown) return;

  const data = await fetchAPI('/categories');
  if (!data?.data) return;

  dropdown.innerHTML = data.data.map((cat) =>
    `<li><a href="/shop?category=${cat._id}">${cat.name}</a></li>`
  ).join('');
}

// --- Back to Top ---
function initBackToTop() {
  document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Analytics ---
function initAnalytics() {
  try {
    fetch(`${API_BASE}/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer || 'direct' }),
    }).catch(() => {});
  } catch (_) {}
}

// --- Error Tracking ---
window.addEventListener('error', (e) => {
  try {
    fetch(`${API_BASE}/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message, page: window.location.pathname }),
    }).catch(() => {});
  } catch (_) {}
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initCartDrawer();
  initMobileMenu();
  initSearch();
  initFAQ();
  initScrollEffects();
  initNewsletter();
  initUserMenu();
  initAnnouncement();
  initFlashSales();
  initCookieConsent();
  initBackToTop();
  initAnalytics();

  loadHeroBanners();
  loadCategories();
  loadFeaturedProducts();
  loadNewArrivals();
  loadBestSellers();
  loadReviews();
  loadCategoryDropdown();
});
