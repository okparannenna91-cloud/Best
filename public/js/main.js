/* ============================
   SOLLENE — Main JavaScript
   Elevating Everyday Living
   ============================ */

const API_BASE = '/api';
const formatPrice = (n) => '₦' + Number(n).toLocaleString('en-US');
function getImgUrl(img) { if (!img) return ''; if (typeof img === 'string') return img; return img.url || ''; }
function getProductImage(product) { return product.images?.length ? getImgUrl(product.images[0]) : ''; }
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

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
  if (!data?.data) { document.getElementById('featuredProducts').innerHTML = ''; return; }
  renderProducts('featuredProducts', data.data);
}

async function loadNewArrivals() {
  const data = await fetchAPI('/products/new-arrivals');
  if (!data?.data) { document.getElementById('newArrivals').innerHTML = ''; return; }
  renderProducts('newArrivals', data.data);
}

async function loadBestSellers() {
  const data = await fetchAPI('/products/best-sellers');
  if (!data?.data) { document.getElementById('bestSellers').innerHTML = ''; return; }
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
          <img src="${getProductImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
          ${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ''}
          ${p.comparePrice ? `<span class="product-badge" style="left:auto;right:12px;background:var(--color-white);color:var(--color-black);">${Math.round((1 - p.price / p.comparePrice) * 100)}% OFF</span>` : ''}
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${escapeHtml(p.category?.name || '')}</span>
          <span class="product-card-name">${escapeHtml(p.name)}</span>
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
      <img src="${cat.image || ''}" alt="${escapeHtml(cat.name)}" loading="lazy" onerror="this.style.display='none'">
      <div class="category-card-overlay"></div>
      <span class="category-card-title">${escapeHtml(cat.name)}</span>
    </a>
  `).join('');
}

function renderHeroSlides(banners) {
  const slider = document.getElementById('heroSlider');
  const dots = document.getElementById('heroDots');
  if (!slider) return;

  slider.innerHTML = banners.map((b, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}">
      <div class="hero-slide-bg" style="background-image:url('${String(b.image || '').replace(/'/g, '%27')}')"></div>
      <div class="hero-content">
        ${b.title ? `<div class="hero-tag">${escapeHtml(b.subtitle || 'Featured')}</div>` : ''}
        <h1 class="hero-title">${escapeHtml(b.title || 'SOLLENE')}</h1>
        <p class="hero-text">${escapeHtml(b.description || 'Elevating Everyday Living')}</p>
        ${b.link ? `<a href="${String(b.link || '').replace(/'/g, '%27')}" class="btn btn-outline" style="border-color:white;color:white;">${escapeHtml(b.buttonText || 'Shop Now')}</a>` :
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

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('open');
    });
  });
}

function initScrollEffects() {
  const header = document.getElementById('header');

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
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
  }, { passive: true });
}

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

  const submitSearch = () => {
    const q = (input?.value || '').trim();
    if (q.length >= 2) window.location = `/shop?search=${encodeURIComponent(q)}`;
  };

  document.querySelector('.search-submit')?.addEventListener('click', submitSearch);

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitSearch();
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
              ${getProductImage(p) ? '<img src="'+getProductImage(p)+'" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.style.display=\'none\'">' : ''}
              <div><div style="font-size:0.85rem;font-weight:500">${escapeHtml(p.name)}</div><div style="font-size:0.8rem;color:var(--color-gray-400)">${formatPrice(p.price)}</div></div>
            </div></div>`).join('');
        } else {
          suggestions.innerHTML = '<div style="padding:12px;font-size:0.85rem;color:var(--color-gray-400)">No products found</div>';
        }
      } catch (_) { suggestions.innerHTML = ''; }
    }, 300);
  });
}

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
        <span class="announcement-text">${escapeHtml(a.text)}${a.link ? ' <a href="'+escapeHtml(a.link)+'" style="color:inherit;text-decoration:underline">'+ escapeHtml(a.linkText||'Learn More') +'</a>' : ''}</span>
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

async function loadCategoryDropdown() {
  const dropdown = document.getElementById('categoryDropdown');
  if (!dropdown) return;

  const data = await fetchAPI('/categories');
  if (!data?.data) return;

  dropdown.innerHTML = data.data.map((cat) =>
    `<li><a href="/shop?category=${cat._id}">${escapeHtml(cat.name)}</a></li>`
  ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearch();
  initFAQ();
  initScrollEffects();
  initAnnouncement();

  loadHeroBanners();
  loadCategories();
  loadFeaturedProducts();
  loadNewArrivals();
  loadBestSellers();
  loadCategoryDropdown();
});
