/* ============================
   SOLLENE — Product Details Page
   ============================ */

const API_BASE = '/api';

// --- Get slug from URL ---
function getProductSlug() {
  const path = window.location.pathname;
  const match = path.match(/\/product\/(.+)/);
  return match ? match[1] : null;
}

// --- Recently viewed (localStorage) ---
function addToRecentlyViewed(product) {
  let viewed = JSON.parse(localStorage.getItem('sollene_recently_viewed') || '[]');
  viewed = viewed.filter((v) => v._id !== product._id);
  viewed.unshift({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: product.images?.[0] || '',
    category: product.category?.name || '',
  });
  if (viewed.length > 6) viewed = viewed.slice(0, 6);
  localStorage.setItem('sollene_recently_viewed', JSON.stringify(viewed));
}

function renderRecentlyViewed() {
  const container = document.getElementById('recentlyViewed');
  if (!container) return;

  const viewed = JSON.parse(localStorage.getItem('sollene_recently_viewed') || '[]');
  if (viewed.length === 0) {
    container.closest('.recently-viewed')?.classList.add('hidden');
    return;
  }

  container.innerHTML = viewed.map((p) => `
    <div class="product-card fade-in" data-product-id="${p._id}" onclick="window.location='/product/${p.slug}'">
      <div class="product-card-image">
        <img src="${p.image || ''}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="product-card-info">
        <span class="product-card-category">${p.category || ''}</span>
        <span class="product-card-name">${p.name}</span>
        <span class="product-card-price" data-original-price="${p.price}">${formatPrice(p.price)}</span>
      </div>
    </div>
  `).join('');
}

// --- Fetch product ---
async function fetchProduct(slug) {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Failed to fetch product:', err);
    return null;
  }
}

async function fetchRelatedProducts(productId) {
  try {
    const res = await fetch(`${API_BASE}/products/related/${productId}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

async function fetchProductReviews(productId) {
  try {
    const res = await fetch(`${API_BASE}/reviews/product/${productId}?limit=100`);
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

// --- Render product ---
function renderProduct(product) {
  // Meta
  document.getElementById('metaTitle').textContent = `${product.name} — SOLLENE`;
  document.getElementById('metaDesc').textContent = product.description || '';
  document.getElementById('ogTitle').textContent = `${product.name} — SOLLENE`;
  document.getElementById('ogDesc').textContent = product.description || '';
  document.getElementById('ogUrl').content = window.location.href;
  document.getElementById('ogImage').content = product.images?.[0] || '';
  document.getElementById('canonical').href = window.location.href;

  // Breadcrumbs
  document.getElementById('breadcrumbCategory').textContent = product.category?.name || '';
  document.getElementById('breadcrumbProduct').textContent = product.name;

  // Gallery
  renderGallery(product.images || []);

  // Info
  document.getElementById('productCategory').textContent = product.category?.name || '';
  document.getElementById('productTitle').textContent = product.name;

  // Rating
  const stars = Math.round(product.ratingsAverage || 0);
  const starHTML = Array.from({ length: 5 }, (_, i) =>
    `<span>${i < stars ? '★' : '☆'}</span>`
  ).join('');
  document.getElementById('productRating').innerHTML = `
    <span class="stars">${starHTML}</span>
    <span>${product.ratingsAverage || '0'} (${product.ratingsCount || 0} reviews)</span>
  `;

  // Price
  let priceHTML = `<span class="current-price">${formatPrice(product.price)}</span>`;
  if (product.comparePrice) {
    const discount = Math.round((1 - product.price / product.comparePrice) * 100);
    priceHTML += `<span class="compare-price">${formatPrice(product.comparePrice)}</span>`;
    priceHTML += `<span class="discount-badge">${discount}% OFF</span>`;
  }
  document.getElementById('productPrice').innerHTML = priceHTML;

  // Stock
  const stockEl = document.getElementById('productStock');
  if (product.stock > 10) {
    stockEl.innerHTML = `<span class="stock-dot in-stock"></span><span class="stock-text in-stock">In Stock</span>`;
  } else if (product.stock > 0) {
    stockEl.innerHTML = `<span class="stock-dot low-stock"></span><span class="stock-text low-stock">Only ${product.stock} left</span>`;
  } else {
    stockEl.innerHTML = `<span class="stock-dot out-of-stock"></span><span class="stock-text out-of-stock">Out of Stock</span>`;
    document.getElementById('addToCartBtn').disabled = true;
    document.getElementById('addToCartBtn').textContent = 'Out of Stock';
    document.getElementById('buyNowBtn').disabled = true;
  }

  // Description
  document.getElementById('productDescription').innerHTML = product.description || '';

  // Variants
  renderVariants(product.variants || []);

  // Show content, hide skeleton
  document.querySelector('.product-info-skeleton')?.classList.add('hidden');
  document.getElementById('productInfoContent')?.classList.remove('hidden');

  // Tabs
  renderDescription(product.description || '');
  renderSpecs(product);
  loadReviews(product._id);

  // Related products
  loadRelatedProducts(product._id);

  // Recently viewed
  addToRecentlyViewed(product);
  renderRecentlyViewed();

  // Store product data for cart
  window._currentProduct = product;
}

// --- Gallery ---
function renderGallery(images) {
  const mainImg = document.getElementById('mainImage');
  const thumbsContainer = document.getElementById('galleryThumbs');

  if (images.length === 0) {
    images = ['/images/placeholder.svg'];
  }

  mainImg.src = images[0];
  mainImg.alt = 'Product image';

  thumbsContainer.innerHTML = images.map((img, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${img}" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
  `).join('');

  // Thumb click
  thumbsContainer.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index);
      mainImg.src = images[idx];
      thumbsContainer.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Zoom
  initZoom(images);
}

// --- Zoom (lens + overlay) ---
function initZoom(images) {
  const wrapper = document.querySelector('.gallery-image-wrapper');
  const mainImg = document.getElementById('mainImage');
  const zoomResult = document.createElement('div');
  zoomResult.className = 'gallery-zoom-result';
  wrapper.appendChild(zoomResult);

  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const pctX = (x / w) * 100;
    const pctY = (y / h) * 100;
    zoomResult.style.backgroundImage = `url('${mainImg.src}')`;
    zoomResult.style.backgroundSize = `${w * 2}px ${h * 2}px`;
    zoomResult.style.backgroundPosition = `${pctX}% ${pctY}%`;
  });

  wrapper.addEventListener('mouseleave', () => {
    zoomResult.style.backgroundImage = '';
  });

  // Fullscreen zoom overlay
  document.getElementById('zoomBtn')?.addEventListener('click', () => {
    document.getElementById('zoomImage').src = mainImg.src;
    document.getElementById('zoomOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('zoomClose')?.addEventListener('click', () => {
    document.getElementById('zoomOverlay').classList.remove('open');
    document.body.style.overflow = '';
  });

  document.getElementById('zoomOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('zoomOverlay').classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// --- Variants ---
function renderVariants(variants) {
  const container = document.getElementById('productVariants');
  if (!variants.length) { container?.classList.add('hidden'); return; }

  container.classList.remove('hidden');

  const grouped = {};
  variants.forEach((v) => {
    if (v.attributes) {
      for (const [key, val] of Object.entries(v.attributes)) {
        if (!grouped[key]) grouped[key] = [];
        if (!grouped[key].includes(val)) grouped[key].push(val);
      }
    }
  });

  let html = '';
  for (const [key, values] of Object.entries(grouped)) {
    html += `<div class="variant-group">
      <label>${key}</label>
      <div class="variant-options">
        ${values.map((val) => `<button class="variant-btn" data-attr="${key}" data-val="${val}">${val}</button>`).join('')}
      </div>
    </div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('.variant-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.variant-group').querySelectorAll('.variant-btn');
      group.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// --- Tabs ---
function renderDescription(desc) {
  document.getElementById('tabDescriptionContent').innerHTML = desc || 'No description available.';
}

function renderSpecs(product) {
  const container = document.getElementById('tabSpecsContent');
  if (!product.specifications && !product.sku && !product.category) {
    container.innerHTML = '<p style="color:var(--color-gray-400)">No specifications available.</p>';
    return;
  }

  const specs = [
    { label: 'SKU', value: product.sku || '-' },
    { label: 'Category', value: product.category?.name || '-' },
    ...(product.specifications ? product.specifications.map((s) => ({ label: s.label, value: s.value })) : []),
  ];

  container.innerHTML = specs.map((s) => `
    <div class="spec-row">
      <span class="spec-label">${s.label}</span>
      <span class="spec-value">${s.value}</span>
    </div>
  `).join('');
}

// --- Reviews ---
async function loadReviews(productId) {
  const data = await fetchProductReviews(productId);
  const container = document.getElementById('tabReviewsContent');
  const countEl = document.getElementById('reviewsCount');

  if (!data?.data || data.data.length === 0) {
    countEl.textContent = '0';
    container.innerHTML = '<p style="color:var(--color-gray-400);padding:32px 0;">No reviews yet. Be the first to review this product.</p>';
    return;
  }

  const reviews = data.data;
  countEl.textContent = reviews.length;

  // Calculate distribution
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  let html = `
    <div class="reviews-summary">
      <div class="reviews-average">
        <div class="big-number">${avg}</div>
        <div class="stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</div>
        <div class="count">${reviews.length} review${reviews.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="reviews-bars">
        ${[5,4,3,2,1].map((star) => `
          <div class="review-bar-row">
            <span class="bar-label">${star}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(dist[star] / reviews.length * 100)}%"></div></div>
            <span class="bar-count">${dist[star]}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  html += reviews.map((r) => `
    <div class="review-item">
      <div class="review-item-header">
        <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        ${r.title ? `<span class="review-item-title">${r.title}</span>` : ''}
        <span class="review-item-date">${new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="review-item-text">${r.comment || ''}</div>
      <div class="review-item-author">${r.user?.firstName || 'Verified'} ${r.user?.lastName || 'Customer'}${r.isVerifiedPurchase ? ' · Verified Purchase' : ''}</div>
    </div>
  `).join('');

  container.innerHTML = html;
}

// --- Related Products ---
async function loadRelatedProducts(productId) {
  const products = await fetchRelatedProducts(productId);
  const container = document.getElementById('relatedProducts');

  if (!products || products.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = products.map((p) => {
    const pJSON = JSON.stringify({ _id: p._id, name: p.name, price: p.price, images: p.images }).replace(/'/g, "&#39;");
    return `
      <div class="product-card fade-in" data-product-id="${p._id}" onclick="window.location='/product/${p.slug}'">
        <div class="product-card-image">
          <img src="${p.images?.[0] || ''}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
          <div class="product-card-actions">
            <button onclick="event.stopPropagation();addToCart(${pJSON});return false;" title="Add to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </button>
          </div>
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${p.category?.name || ''}</span>
          <span class="product-card-name">${p.name}</span>
          <span class="product-card-price" data-original-price="${p.price}">${formatPrice(p.price)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// --- Wishlist toggle on product page ---
function initProductWishlist(productId) {
  const btn = document.getElementById('productWishlistBtn');
  if (!btn) return;

  let wishlist = JSON.parse(localStorage.getItem('sollene_wishlist') || '[]');
  if (wishlist.includes(productId)) {
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
  }

  btn.addEventListener('click', () => {
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      btn.querySelector('svg').setAttribute('fill', 'none');
    } else {
      wishlist.push(productId);
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
    }
    localStorage.setItem('sollene_wishlist', JSON.stringify(wishlist));
    document.getElementById('wishlistBadge').textContent = wishlist.length;
  });
}

// --- Share ---
function initShare() {
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      const span = document.querySelector('#shareBtn span');
      const orig = span.textContent;
      span.textContent = 'Copied!';
      setTimeout(() => (span.textContent = orig), 2000);
    }
  });
}

// --- Quantity ---
function initQuantity() {
  const input = document.getElementById('qtyInput');
  document.getElementById('qtyDecrease')?.addEventListener('click', () => {
    const val = parseInt(input.value) || 1;
    if (val > 1) input.value = val - 1;
  });
  document.getElementById('qtyIncrease')?.addEventListener('click', () => {
    const val = parseInt(input.value) || 1;
    if (val < 99) input.value = val + 1;
  });
  input?.addEventListener('change', () => {
    let val = parseInt(input.value) || 1;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
  });
}

// --- Add to Cart from product page ---
function initAddToCart() {
  document.getElementById('addToCartBtn')?.addEventListener('click', () => {
    const product = window._currentProduct;
    if (!product) return;
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    const cart = JSON.parse(localStorage.getItem('sollene_cart') || '[]');
    const existing = cart.find((i) => i._id === product._id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: qty,
      });
    }
    localStorage.setItem('sollene_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartDrawer();
    openCart();
  });
}

// --- Buy Now ---
function initBuyNow() {
  document.getElementById('buyNowBtn')?.addEventListener('click', () => {
    const product = window._currentProduct;
    if (!product) return;
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    const cart = [{
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: qty,
    }];
    localStorage.setItem('sollene_cart', JSON.stringify(cart));
    updateCartBadge();
    window.location = '/checkout';
  });
}

// --- Tabs init ---
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById(`tab${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`);
      if (tab) tab.classList.add('active');
    });
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  const slug = getProductSlug();
  if (!slug) {
    document.querySelector('.product-detail').innerHTML = '<p style="text-align:center;padding:80px 0;color:var(--color-gray-400)">Product not found.</p>';
    return;
  }

  const product = await fetchProduct(slug);
  if (!product) {
    document.querySelector('.product-detail').innerHTML = '<p style="text-align:center;padding:80px 0;color:var(--color-gray-400)">Product not found.</p>';
    return;
  }

  renderProduct(product);
  initProductWishlist(product._id);
  initQuantity();
  initAddToCart();
  initBuyNow();
  initTabs();
  initShare();
  renderRecentlyViewed();
  if (typeof initFlashSales === 'function') setTimeout(initFlashSales, 100);
});
