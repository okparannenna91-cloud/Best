/* ============================
   SOLLENE — Shop Listing Page
   ============================ */

const API_BASE = '/api';
const PRODUCTS_PER_PAGE = 12;

let currentState = {
  page: 1,
  category: '',
  minPrice: '',
  maxPrice: '',
  search: '',
  sort: 'newest',
  inStock: false,
};

let categoriesCache = null;

function getQueryFromState() {
  const params = new URLSearchParams();
  if (currentState.page > 1) params.set('page', currentState.page);
  if (currentState.category) params.set('category', currentState.category);
  if (currentState.minPrice) params.set('minPrice', currentState.minPrice);
  if (currentState.maxPrice) params.set('maxPrice', currentState.maxPrice);
  if (currentState.search) params.set('search', currentState.search);
  if (currentState.sort !== 'newest') params.set('sort', currentState.sort);
  if (currentState.inStock) params.set('inStock', 'true');
  const qs = params.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

function getStateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  currentState.page = parseInt(params.get('page')) || 1;
  currentState.category = params.get('category') || '';
  currentState.minPrice = params.get('minPrice') || '';
  currentState.maxPrice = params.get('maxPrice') || '';
  currentState.search = params.get('search') || '';
  currentState.sort = params.get('sort') || 'newest';
  currentState.inStock = params.get('inStock') === 'true';
}

async function fetchProducts() {
  const params = new URLSearchParams({
    page: currentState.page,
    limit: PRODUCTS_PER_PAGE,
    sort: currentState.sort,
  });
  if (currentState.category) params.set('category', currentState.category);
  if (currentState.minPrice) params.set('minPrice', currentState.minPrice);
  if (currentState.maxPrice) params.set('maxPrice', currentState.maxPrice);
  if (currentState.search) params.set('search', currentState.search);
  if (currentState.inStock) params.set('inStock', 'true');

  try {
    const res = await fetch(`${API_BASE}/products?${params}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return null;
  }
}

async function fetchCategories() {
  if (categoriesCache) return categoriesCache;
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    categoriesCache = data.data || [];
    return categoriesCache;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    return [];
  }
}

function renderProducts(products) {
  const container = document.getElementById('shopProducts');
  const empty = document.getElementById('shopEmpty');

  if (!products || products.length === 0) {
    container.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

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

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 50);
    });
  });
}

function renderPagination(total, page, pages) {
  const container = document.getElementById('pagination');
  if (pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  html += `<button class="pagination-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>&#9664;</button>`;

  const range = 2;
  const start = Math.max(1, page - range);
  const end = Math.min(pages, page + range);

  if (start > 1) {
    html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += '<span class="pagination-ellipsis">...</span>';
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (end < pages) {
    if (end < pages - 1) html += '<span class="pagination-ellipsis">...</span>';
    html += `<button class="pagination-btn" onclick="goToPage(${pages})">${pages}</button>`;
  }

  html += `<button class="pagination-btn" onclick="goToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>&#9654;</button>`;

  container.innerHTML = html;
}

function renderCategoryFilters(categories) {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  let html = `<label class="filter-option">
    <input type="radio" name="category" value="" ${!currentState.category ? 'checked' : ''}>
    All Categories
  </label>`;

  html += categories.map((cat) => `
    <label class="filter-option">
      <input type="radio" name="category" value="${cat._id}" ${currentState.category === cat._id ? 'checked' : ''}>
      ${cat.name}
    </label>
  `).join('');

  container.innerHTML = html;

  container.querySelectorAll('input[name="category"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentState.category = e.target.value;
        currentState.page = 1;
        updateShop();
      }
    });
  });
}

function renderActiveFilters() {
  const container = document.getElementById('activeFilters');
  let tags = '';

  if (currentState.category && categoriesCache) {
    const cat = categoriesCache.find((c) => c._id === currentState.category);
    if (cat) {
      tags += `<span class="active-filter-tag">${cat.name} <button onclick="removeFilter('category')">&times;</button></span>`;
    }
  }
  if (currentState.search) {
    tags += `<span class="active-filter-tag">"${currentState.search}" <button onclick="removeFilter('search')">&times;</button></span>`;
  }
  if (currentState.minPrice || currentState.maxPrice) {
    tags += `<span class="active-filter-tag">Price: ${currentState.minPrice || '0'} — ${currentState.maxPrice || '∞'} <button onclick="removeFilter('price')">&times;</button></span>`;
  }
  if (currentState.inStock) {
    tags += `<span class="active-filter-tag">In stock <button onclick="removeFilter('inStock')">&times;</button></span>`;
  }

  container.innerHTML = tags;
}

window.goToPage = function (page) {
  currentState.page = page;
  updateShop();
};

window.removeFilter = function (key) {
  if (key === 'category') currentState.category = '';
  if (key === 'search') { currentState.search = ''; document.getElementById('shopSearch').value = ''; }
  if (key === 'price') { currentState.minPrice = ''; currentState.maxPrice = ''; document.getElementById('minPrice').value = ''; document.getElementById('maxPrice').value = ''; }
  if (key === 'inStock') { currentState.inStock = false; document.getElementById('inStockOnly').checked = false; }
  currentState.page = 1;
  updateShop();
};

function clearAllFilters() {
  currentState.category = '';
  currentState.minPrice = '';
  currentState.maxPrice = '';
  currentState.search = '';
  currentState.inStock = false;
  currentState.page = 1;
  currentState.sort = 'newest';

  document.getElementById('shopSearch').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('inStockOnly').checked = false;
  document.getElementById('sortSelect').value = 'newest';

  document.querySelectorAll('input[name="category"]').forEach((r) => {
    if (r.value === '') r.checked = true;
  });

  updateShop();
}

function updateResultsCount(total) {
  const el = document.getElementById('resultsCount');
  if (el) el.textContent = `${total} product${total !== 1 ? 's' : ''}`;
}

async function updateShop() {
  getQueryFromState();
  renderActiveFilters();

  const container = document.getElementById('shopProducts');
  container.innerHTML = `<div class="skeleton-grid">${Array.from({ length: 8 }, () => '<div class="skeleton-card"></div>').join('')}</div>`;

  const data = await fetchProducts();
  if (!data) return;

  renderProducts(data.data);
  renderPagination(data.data.length, data.pagination.page, data.pagination.pages);
  updateResultsCount(data.pagination.total);
}

async function initShop() {
  getStateFromQuery();

  const categories = await fetchCategories();
  renderCategoryFilters(categories);

  document.getElementById('shopSearch').value = currentState.search;
  document.getElementById('minPrice').value = currentState.minPrice;
  document.getElementById('maxPrice').value = currentState.maxPrice;
  document.getElementById('inStockOnly').checked = currentState.inStock;
  document.getElementById('sortSelect').value = currentState.sort;

  await updateShop();

  let searchTimeout;
  document.getElementById('shopSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentState.search = e.target.value;
      currentState.page = 1;
      updateShop();
    }, 400);
  });

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentState.sort = e.target.value;
    currentState.page = 1;
    updateShop();
  });

  document.getElementById('priceApply').addEventListener('click', () => {
    currentState.minPrice = document.getElementById('minPrice').value;
    currentState.maxPrice = document.getElementById('maxPrice').value;
    currentState.page = 1;
    updateShop();
  });

  document.getElementById('inStockOnly').addEventListener('change', (e) => {
    currentState.inStock = e.target.checked;
    currentState.page = 1;
    updateShop();
  });

  document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
  document.getElementById('resetFromEmpty').addEventListener('click', clearAllFilters);

  document.querySelectorAll('.filter-header').forEach((h) => {
    h.addEventListener('click', () => {
      h.parentElement.classList.toggle('open');
    });
  });

  document.getElementById('mobileFilterBtn').addEventListener('click', () => {
    document.querySelector('.shop-sidebar').classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.querySelector('.shop-sidebar').classList.remove('open');
    document.body.style.overflow = '';
  });

  document.querySelector('.filter-group')?.classList.add('open');
}

document.addEventListener('DOMContentLoaded', initShop);
