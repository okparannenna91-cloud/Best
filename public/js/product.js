/* ============================
   SOLLENE — Product Details Page
   ============================ */

let whatsappNumber = '2348055188508';

async function loadWhatsAppConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    const data = await res.json();
    if (data.whatsappNumber) whatsappNumber = data.whatsappNumber;
  } catch (_) {}
}

function getProductSlug() {
  const path = window.location.pathname;
  const match = path.match(/\/product\/(.+)/);
  return match ? match[1] : null;
}

function addToRecentlyViewed(product) {
  let viewed = JSON.parse(localStorage.getItem('sollene_recently_viewed') || '[]');
  viewed = viewed.filter((v) => v._id !== product._id);
  viewed.unshift({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: getProductImage(product),
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
        <img src="${p.image || ''}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="product-card-info">
        <span class="product-card-category">${escapeHtml(p.category || '')}</span>
        <span class="product-card-name">${escapeHtml(p.name)}</span>
        <span class="product-card-price" data-original-price="${p.price}">${formatPrice(p.price)}</span>
      </div>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 50);
    });
  });
}

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

function renderProduct(product) {
  document.getElementById('metaTitle').textContent = `${product.name} — SOLLENE`;
  document.getElementById('metaDesc').textContent = product.description || '';
  document.getElementById('ogTitle').textContent = `${product.name} — SOLLENE`;
  document.getElementById('ogDesc').textContent = product.description || '';
  document.getElementById('ogUrl').content = window.location.href;
  document.getElementById('ogImage').content = getProductImage(product);
  document.getElementById('twitterTitle').content = `${product.name} — SOLLENE`;
  document.getElementById('twitterDesc').content = product.description || '';
  document.getElementById('twitterImage').content = getProductImage(product);
  document.getElementById('canonical').href = window.location.href;

  document.getElementById('breadcrumbCategory').textContent = product.category?.name || '';
  document.getElementById('breadcrumbProduct').textContent = product.name;

  renderGallery(product.images || []);

  document.getElementById('productCategory').textContent = product.category?.name || '';
  document.getElementById('productTitle').textContent = product.name;

  const stars = Math.round(product.ratingsAverage || 0);
  const starHTML = Array.from({ length: 5 }, (_, i) =>
    `<span>${i < stars ? '★' : '☆'}</span>`
  ).join('');
  document.getElementById('productRating').innerHTML = `
    <span class="stars">${starHTML}</span>
    <span>${product.ratingsAverage || '0'} (${product.ratingsCount || 0} reviews)</span>
  `;

  let priceHTML = `<span class="current-price">${formatPrice(product.price)}</span>`;
  if (product.comparePrice) {
    const discount = Math.round((1 - product.price / product.comparePrice) * 100);
    priceHTML += `<span class="compare-price">${formatPrice(product.comparePrice)}</span>`;
    priceHTML += `<span class="discount-badge">${discount}% OFF</span>`;
  }
  document.getElementById('productPrice').innerHTML = priceHTML;

  const stockEl = document.getElementById('productStock');
  if (product.stock > 10) {
    stockEl.innerHTML = `<span class="stock-dot in-stock"></span><span class="stock-text in-stock">In Stock</span>`;
  } else if (product.stock > 0) {
    stockEl.innerHTML = `<span class="stock-dot low-stock"></span><span class="stock-text low-stock">Only ${product.stock} left</span>`;
  } else {
    stockEl.innerHTML = `<span class="stock-dot out-of-stock"></span><span class="stock-text out-of-stock">Out of Stock</span>`;
  }

  document.getElementById('productDescription').innerHTML = escapeHtml(product.description || '');
  renderVariants(product.variants || []);

  document.querySelector('.product-info-skeleton')?.classList.add('hidden');
  document.getElementById('productInfoContent')?.classList.remove('hidden');

  renderDescription(product.description || '');
  renderSpecs(product);

  loadRelatedProducts(product._id);

  addToRecentlyViewed(product);
  renderRecentlyViewed();

  window._currentProduct = product;
}

function renderGallery(images) {
  const mainImg = document.getElementById('mainImage');
  const thumbsContainer = document.getElementById('galleryThumbs');
  const urls = images.map(img => getImgUrl(img));

  if (urls.length === 0) {
    urls.push('/images/placeholder.svg');
  }

  mainImg.src = urls[0];
  mainImg.alt = 'Product image';

  thumbsContainer.innerHTML = urls.map((url, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${url}" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
  `).join('');

  thumbsContainer.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index);
      mainImg.src = urls[idx];
      thumbsContainer.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  initZoom(urls);
}

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
      <label>${escapeHtml(key)}</label>
      <div class="variant-options">
        ${values.map((val) => `<button class="variant-btn" data-attr="${escapeHtml(key)}" data-val="${escapeHtml(val)}">${escapeHtml(val)}</button>`).join('')}
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

function renderDescription(desc) {
  document.getElementById('tabDescriptionContent').innerHTML = escapeHtml(desc || 'No description available.');
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
      <span class="spec-label">${escapeHtml(s.label)}</span>
      <span class="spec-value">${escapeHtml(s.value)}</span>
    </div>
  `).join('');
}

async function loadRelatedProducts(productId) {
  const products = await fetchRelatedProducts(productId);
  const container = document.getElementById('relatedProducts');

  if (!products || products.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = products.map((p) => {
    return `
      <div class="product-card fade-in" data-product-id="${p._id}" onclick="window.location='/product/${p.slug}'">
        <div class="product-card-image">
          <img src="${getProductImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${escapeHtml(p.category?.name || '')}</span>
          <span class="product-card-name">${escapeHtml(p.name)}</span>
          <span class="product-card-price" data-original-price="${p.price}">${formatPrice(p.price)}</span>
        </div>
      </div>
    `;
  }).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 50);
    });
  });
}

function initShare() {
  const shareBtn = document.getElementById('shareBtn');
  const shareMenu = document.getElementById('shareMenu');
  const shareOverlay = document.getElementById('shareOverlay');
  const shareClose = document.getElementById('shareMenuClose');

  if (!shareBtn || !shareMenu) return;

  function openShareMenu(e) {
    e.stopPropagation();
    shareMenu.classList.add('open');
    shareOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    shareBtn.setAttribute('aria-expanded', 'true');
  }

  function closeShareMenu() {
    shareMenu.classList.remove('open');
    shareOverlay?.classList.remove('open');
    document.body.style.overflow = '';
    shareBtn.setAttribute('aria-expanded', 'false');
  }

  function getShareText() {
    const product = window._currentProduct;
    const name = product?.name || document.title;
    const url = window.location.href;
    return { name, url };
  }

  function shareToWhatsApp() {
    const { name, url } = getShareText();
    const text = `Check out this beautiful product from SOLLENE:%0A%0A${name}%0A${url}`;
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    closeShareMenu();
  }

  function shareToFacebook() {
    const { url } = getShareText();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    closeShareMenu();
  }

  shareBtn.addEventListener('click', openShareMenu);

  shareClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeShareMenu();
  });

  shareOverlay?.addEventListener('click', closeShareMenu);

  document.getElementById('shareWhatsApp')?.addEventListener('click', shareToWhatsApp);
  document.getElementById('shareFacebook')?.addEventListener('click', shareToFacebook);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shareMenu.classList.contains('open')) {
      closeShareMenu();
    }
  });

  document.addEventListener('click', (e) => {
    if (shareMenu.classList.contains('open') && !shareMenu.contains(e.target) && e.target !== shareBtn && !shareBtn.contains(e.target)) {
      closeShareMenu();
    }
  });

  shareMenu.querySelectorAll('.share-option').forEach((opt) => {
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShareMenu();
    });
  });
}

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

function initOrderWhatsApp() {
  document.getElementById('orderWhatsAppBtn')?.addEventListener('click', () => {
    const product = window._currentProduct;
    if (!product) return;
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    const message = `Hello SOLLENE! I'd like to order:\n\n*${product.name}*\nPrice: ${formatPrice(product.price)}\nQuantity: ${qty}\n\nPlease provide more details.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  });
}

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

document.addEventListener('DOMContentLoaded', async () => {
  await loadWhatsAppConfig();

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
  initQuantity();
  initOrderWhatsApp();
  initTabs();
  initShare();
  renderRecentlyViewed();
});
