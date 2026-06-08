/* =========================================================
   ADMIN PANEL — admin.js
   Auth, CRUD portfolio items, upload, sub-items, site content
========================================================= */

const MAX_FILE_SIZE = 1048576; // 1 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/* =========================
   TOAST
========================= */
function toast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  
  const bgClass = type === 'success' 
    ? 'bg-zinc-900 border-emerald-500/35 text-zinc-100 shadow-emerald-950/20' 
    : 'bg-zinc-900 border-red-500/35 text-red-200 shadow-red-950/20';
  
  const icon = type === 'success'
    ? `<svg class="text-emerald-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg class="text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>`;

  el.className = `flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-xs font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  el.innerHTML = icon;
  const text = document.createElement('span');
  text.textContent = String(message);
  el.appendChild(text);
  container.appendChild(el);
  
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => { 
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => el.remove(), 300); 
  }, 3500);
}

/* =========================
   AUTH
========================= */
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

function showApp() {
  if (loginScreen) loginScreen.style.display = 'none';
  if (adminApp) adminApp.style.display = 'block';
}

function showLogin() {
  if (loginScreen) loginScreen.style.display = 'flex';
  if (adminApp) adminApp.style.display = 'none';
}

async function authorizeAdmin() {
  const { data, error } = await supabaseClient.rpc('is_portfolio_admin');
  if (error) throw error;
  return data === true;
}

async function enterAdmin() {
  const allowed = await authorizeAdmin();
  if (!allowed) {
    await supabaseClient.auth.signOut();
    showLogin();
    if (loginError) loginError.textContent = 'Akun ini tidak memiliki akses admin.';
    return;
  }
  showApp();
  await initAdmin();
}

// Check session on load
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    try {
      await enterAdmin();
    } catch (err) {
      showLogin();
      if (loginError) loginError.textContent = err.message || 'Gagal memverifikasi akses admin.';
    }
  } else {
    showLogin();
  }
})();

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });

  if (error) {
    loginError.textContent = error.message || 'Login gagal.';
    return;
  }

  try {
    await enterAdmin();
  } catch (err) {
    await supabaseClient.auth.signOut();
    showLogin();
    loginError.textContent = err.message || 'Gagal memverifikasi akses admin.';
  }
});

// Logout
logoutBtn?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* =========================
   TABS
========================= */
const tabs = document.querySelectorAll('.tab');
const tabPortfolio = document.getElementById('tabPortfolio');
const tabSettings = document.getElementById('tabSettings');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    const target = tab.dataset.tab;
    if (tabPortfolio) tabPortfolio.style.display = target === 'portfolio' ? 'block' : 'none';
    if (tabSettings) tabSettings.style.display = target === 'settings' ? 'block' : 'none';
  });
});

// Set tab default aktif
const defaultTab = document.querySelector('.tab[data-tab="portfolio"]');
if (defaultTab) defaultTab.classList.add('is-active');

/* =========================
   DATA STATE
========================= */
let allItems = [];
let allSubs = [];
let filterCat = '';
let searchQ = '';

/* =========================
   INIT
========================= */
async function initAdmin() {
  await loadItems();
  await loadSiteContent();
  setupPhotoUploaders();
}

/* =========================
   LOAD ITEMS
========================= */
async function loadItems() {
  const { data: items, error: e1 } = await supabaseClient
    .from('portfolio_items')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: subs, error: e2 } = await supabaseClient
    .from('portfolio_sub_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (e1) { toast('Gagal memuat items: ' + e1.message, 'error'); return; }
  if (e2) { toast('Gagal memuat sub-items: ' + e2.message, 'error'); }

  allItems = items || [];
  allSubs = subs || [];

  populateCategoryFilter();
  renderItems();
}

function populateCategoryFilter() {
  const sel = document.getElementById('filterCategory');
  if (!sel) return;
  
  const cats = [...new Set(allItems.map(i => i.category))].filter(Boolean);
  
  sel.innerHTML = `<option value="">Semua Kategori</option>` +
    cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function populateCategoryDropdown(selectedVal = '') {
  const sel = document.getElementById('itemCategory');
  if (!sel) return;

  const dbCats = [...new Set(allItems.map(i => i.category))].filter(Boolean);

  const defaultCats = [
    "Long Video (YouTube)",
    "Project Video",
    "Short Video (IG)",
    "Bumper Event (IG)",
    "Feed Carousel (IG)",
    "Flyer (IG)",
    "Photo",
    "Poster Design"
  ];

  const allCats = [...new Set([...defaultCats, ...dbCats])];

  if (selectedVal && !allCats.includes(selectedVal)) {
    allCats.push(selectedVal);
  }

  let html = `<option value="">Pilih...</option>`;
  html += allCats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  html += `<option value="__new__" style="color: #10b981; font-weight: bold;">+ Tambah Kategori Baru...</option>`;

  sel.innerHTML = html;

  if (selectedVal) {
    sel.value = selectedVal;
  }
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m])
  );
}

/* =========================
   RENDER ITEMS
========================= */
function renderItems() {
  const grid = document.getElementById('itemsGrid');
  const countEl = document.getElementById('itemCount');
  if (!grid) return;

  let filtered = allItems;

  if (filterCat) filtered = filtered.filter(i => i.category === filterCat);
  if (searchQ) {
    const q = searchQ.toLowerCase();
    filtered = filtered.filter(i =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q)
    );
  }

  if (countEl) countEl.textContent = `${filtered.length} items`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="items-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Tidak ada item ditemukan</div>
        <div style="font-size:11px;">Coba ubah filter atau kata kunci pencarian.</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const ytId = item.type === 'youtube' ? getYoutubeId(item.source_url || item.embed_url) : '';
    const thumb = item.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
    const hasSubs = allSubs.some(s => s.parent_id === item.id);
    const subsCount = allSubs.filter(s => s.parent_id === item.id).length;

    const thumbHtml = thumb
      ? `<img src="${esc(thumb)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <div class="item-thumb-empty" style="display:none">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>`
      : `<div class="item-thumb-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>`;

    return `
      <div class="item-card" data-id="${esc(item.id)}">
        <div class="item-card-inner">
          <!-- Thumbnail -->
          <div class="item-thumb-wrap">
            <div class="item-sort-badge">#${esc(item.sort_order ?? 0)}</div>
            ${thumbHtml}
          </div>

          <!-- Content -->
          <div class="item-content">
            <div class="item-title-row">
              <h4 title="${esc(item.title)}">${esc(item.title)}</h4>
            </div>

            <div class="item-badges">
              <span class="badge-cat">${esc(item.category)}</span>
              <span class="badge-type">${esc(item.type)}</span>
              ${item.is_featured ? '<span class="badge-featured">★ Featured</span>' : ''}
              ${hasSubs ? `<span class="badge-subs">${subsCount} sub-item${subsCount > 1 ? 's' : ''}</span>` : ''}
            </div>

            <p class="item-desc">${esc(item.description || 'Tidak ada deskripsi.')}</p>

            ${(item.tags || []).length > 0 ? `
              <div class="item-tags">
                ${item.tags.map(t => `<span class="item-tag">${esc(t)}</span>`).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="item-actions">
            <button class="act-edit edit-btn" data-id="${esc(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>Edit
            </button>
            <button class="act-delete delete-btn" data-id="${esc(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:3px"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach events
  grid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

// Filter & Search
document.getElementById('filterCategory')?.addEventListener('change', (e) => {
  filterCat = e.target.value;
  renderItems();
});
document.getElementById('searchItems')?.addEventListener('input', (e) => {
  searchQ = e.target.value;
  renderItems();
});

/* =========================
   ADD / EDIT MODAL
========================= */
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const modalTitleEl = document.getElementById('modalTitle');

let pendingThumbFile = null;
let pendingFeaturedThumbFile = null;
let editingSubItems = [];

document.getElementById('addItemBtn')?.addEventListener('click', () => openAddModal());
document.getElementById('modalClose')?.addEventListener('click', closeItemModal);
document.getElementById('cancelFormBtn')?.addEventListener('click', closeItemModal);

function openAddModal() {
  modalTitleEl.textContent = 'Tambah Item';
  itemForm.reset();
  document.getElementById('itemId').value = '';
  document.getElementById('itemSortOrder').value = allItems.length;
  pendingThumbFile = null;
  pendingFeaturedThumbFile = null;
  editingSubItems = [];
  clearThumbPreview();
  clearFeaturedThumbPreview();
  updateSubItemsUI();
  updateTypeFields();
  updateFeaturedField();
  
  // Reset input kategori baru inline
  const catNew = document.getElementById('itemCategoryNew');
  if (catNew) {
    catNew.classList.add('hidden');
    catNew.value = '';
    catNew.required = false;
  }
  const catSel = document.getElementById('itemCategory');
  if (catSel) catSel.required = true;

  populateCategoryDropdown('');
  itemModal.style.display = 'flex';
}

function openEditModal(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;

  modalTitleEl.textContent = 'Edit Item';
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemTitle').value = item.title || '';
  
  // Reset input kategori baru inline
  const catNew = document.getElementById('itemCategoryNew');
  if (catNew) {
    catNew.classList.add('hidden');
    catNew.value = '';
    catNew.required = false;
  }
  const catSel = document.getElementById('itemCategory');
  if (catSel) catSel.required = true;

  populateCategoryDropdown(item.category || '');
  document.getElementById('itemType').value = item.type || 'link';
  document.getElementById('itemSortOrder').value = item.sort_order ?? 0;
  document.getElementById('itemSourceUrl').value = item.source_url || '';
  document.getElementById('itemEmbedUrl').value = item.embed_url || '';
  document.getElementById('itemDesc').value = item.description || '';
  const tagsArray = Array.isArray(item.tags)
    ? item.tags
    : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : []);
  document.getElementById('itemTags').value = tagsArray.join(', ');
  document.getElementById('itemFeatured').checked = !!item.is_featured;
  let thumbUrl = item.thumbnail_url || '';
  if (!thumbUrl && item.type === 'youtube') {
    const ytId = getYoutubeId(item.source_url || item.embed_url);
    if (ytId) {
      thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
  document.getElementById('itemThumbUrl').value = thumbUrl;
  document.getElementById('itemFeaturedThumbUrl').value = item.featured_thumb || '';

  pendingThumbFile = null;
  pendingFeaturedThumbFile = null;

  // Show thumb preview
  setThumbPreview(thumbUrl);
  setFeaturedThumbPreview(item.featured_thumb);

  // Load sub-items
  editingSubItems = allSubs
    .filter(s => s.parent_id === id)
    .map(s => ({ ...s }));

  updateSubItemsUI();
  updateTypeFields();
  updateFeaturedField();
  itemModal.style.display = 'flex';
}

function closeItemModal() {
  itemModal.style.display = 'none';
}

function getYoutubeId(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
}

function autoFillYoutubeThumbnail() {
  const type = document.getElementById('itemType')?.value;
  const sourceUrl = document.getElementById('itemSourceUrl')?.value.trim() || '';
  const embedUrl = document.getElementById('itemEmbedUrl')?.value.trim() || '';
  const thumbUrlInput = document.getElementById('itemThumbUrl');
  
  if (type === 'youtube' && !pendingThumbFile && (!thumbUrlInput.value || thumbUrlInput.value.includes('img.youtube.com'))) {
    const ytId = getYoutubeId(sourceUrl || embedUrl);
    if (ytId) {
      const computedThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      thumbUrlInput.value = computedThumb;
      setThumbPreview(computedThumb);
    }
  }
}

// Type change -> show/hide sub-items & auto fill yt thumbnail
document.getElementById('itemType')?.addEventListener('change', () => {
  updateTypeFields();
  autoFillYoutubeThumbnail();
});
document.getElementById('itemSourceUrl')?.addEventListener('input', autoFillYoutubeThumbnail);
document.getElementById('itemEmbedUrl')?.addEventListener('input', autoFillYoutubeThumbnail);

// Category change -> prompt for new category
// Category change -> show/hide inline new category text input
document.getElementById('itemCategory')?.addEventListener('change', (e) => {
  const sel = e.target;
  const catNew = document.getElementById('itemCategoryNew');
  if (!catNew) return;

  if (sel.value === '__new__') {
    catNew.classList.remove('hidden');
    catNew.focus();
    catNew.required = true;
    sel.required = false;
  } else {
    catNew.classList.add('hidden');
    catNew.value = '';
    catNew.required = false;
    sel.required = true;
  }
});

function updateTypeFields() {
  const type = document.getElementById('itemType')?.value;
  const subSection = document.getElementById('subItemsSection');
  if (subSection) subSection.style.display = type === 'drive_folder' ? 'block' : 'none';
}

// Featured checkbox
document.getElementById('itemFeatured')?.addEventListener('change', updateFeaturedField);

function updateFeaturedField() {
  const checked = document.getElementById('itemFeatured')?.checked;
  const field = document.getElementById('featuredThumbField');
  if (field) field.style.display = checked ? 'block' : 'none';
}

/* =========================
   THUMBNAIL UPLOAD UI
========================= */
const thumbFile = document.getElementById('thumbFile');
const thumbPickBtn = document.getElementById('thumbPickBtn');
const thumbRemoveBtn = document.getElementById('thumbRemoveBtn');
const thumbPreview = document.getElementById('thumbPreview');

thumbPickBtn?.addEventListener('click', () => thumbFile?.click());
thumbFile?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    toast('File terlalu besar! Max 1 MB.', 'error');
    thumbFile.value = '';
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    toast('Format gambar harus JPG, PNG, WebP, atau GIF.', 'error');
    thumbFile.value = '';
    return;
  }
  pendingThumbFile = file;
  const url = URL.createObjectURL(file);
  setThumbPreview(url);
});
thumbRemoveBtn?.addEventListener('click', () => {
  pendingThumbFile = null;
  document.getElementById('itemThumbUrl').value = '';
  clearThumbPreview();
});

function setThumbPreview(url) {
  if (!thumbPreview) return;
  if (url) {
    thumbPreview.innerHTML = `<img src="${esc(url)}" class="w-full h-full object-cover" alt="" />`;
    if (thumbRemoveBtn) thumbRemoveBtn.style.display = 'inline-flex';
  } else {
    clearThumbPreview();
  }
}
function clearThumbPreview() {
  if (thumbPreview) thumbPreview.innerHTML = `<span class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">No Image</span>`;
  if (thumbRemoveBtn) thumbRemoveBtn.style.display = 'none';
}

/* Featured Thumbnail */
const featuredThumbFile = document.getElementById('featuredThumbFile');
const featuredThumbPickBtn = document.getElementById('featuredThumbPickBtn');
const featuredThumbRemoveBtn = document.getElementById('featuredThumbRemoveBtn');
const featuredThumbPreview = document.getElementById('featuredThumbPreview');

featuredThumbPickBtn?.addEventListener('click', () => featuredThumbFile?.click());
featuredThumbFile?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    toast('File terlalu besar! Max 1 MB.', 'error');
    featuredThumbFile.value = '';
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    toast('Format gambar harus JPG, PNG, WebP, atau GIF.', 'error');
    featuredThumbFile.value = '';
    return;
  }
  pendingFeaturedThumbFile = file;
  setFeaturedThumbPreview(URL.createObjectURL(file));
});
featuredThumbRemoveBtn?.addEventListener('click', () => {
  pendingFeaturedThumbFile = null;
  document.getElementById('itemFeaturedThumbUrl').value = '';
  clearFeaturedThumbPreview();
});

function setFeaturedThumbPreview(url) {
  if (!featuredThumbPreview) return;
  if (url) {
    featuredThumbPreview.innerHTML = `<img src="${esc(url)}" class="w-full h-full object-cover" alt="" />`;
    if (featuredThumbRemoveBtn) featuredThumbRemoveBtn.style.display = 'inline-flex';
  } else {
    clearFeaturedThumbPreview();
  }
}
function clearFeaturedThumbPreview() {
  if (featuredThumbPreview) featuredThumbPreview.innerHTML = `<span class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">No Image</span>`;
  if (featuredThumbRemoveBtn) featuredThumbRemoveBtn.style.display = 'none';
}

/* =========================
   SUB-ITEMS UI
========================= */
document.getElementById('addSubItemBtn')?.addEventListener('click', () => {
  editingSubItems.push({ title: '', type: 'drive_video', source_url: '', embed_url: '', folder_url: '' });
  updateSubItemsUI();
});

function updateSubItemsUI() {
  const list = document.getElementById('subItemsList');
  if (!list) return;

  list.innerHTML = editingSubItems.map((sub, idx) => `
    <div class="flex flex-col gap-3 bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg mb-2 relative sub-item-row" data-idx="${idx}">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Judul</label>
          <input type="text" value="${esc(sub.title)}" data-field="title" class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tipe</label>
          <select data-field="type" class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full">
            <option value="drive_video" ${sub.type === 'drive_video' ? 'selected' : ''}>Drive Video</option>
            <option value="drive_image" ${sub.type === 'drive_image' ? 'selected' : ''}>Drive Image</option>
            <option value="drive_subfolder" ${sub.type === 'drive_subfolder' ? 'selected' : ''}>Drive Subfolder</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Source URL</label>
          <input type="text" value="${esc(sub.source_url)}" data-field="source_url" class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Embed URL</label>
          <input type="text" value="${esc(sub.embed_url)}" data-field="embed_url" class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Folder URL</label>
          <input type="text" value="${esc(sub.folder_url || '')}" data-field="folder_url" class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full" />
        </div>
      </div>
      <button type="button" class="absolute top-3 right-3 bg-transparent hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 w-7 h-7 rounded-md flex items-center justify-center transition-colors sub-remove-btn" data-idx="${idx}">
        ✕
      </button>
    </div>
  `).join('');

  // Sync inputs (termasuk select)
  list.querySelectorAll('input, select').forEach(inp => {
    const evtType = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(evtType, () => {
      const row = inp.closest('.sub-item-row');
      const idx = parseInt(row.dataset.idx);
      const field = inp.dataset.field;
      if (editingSubItems[idx]) editingSubItems[idx][field] = inp.value;
    });
  });

  list.querySelectorAll('.sub-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingSubItems.splice(parseInt(btn.dataset.idx), 1);
      updateSubItemsUI();
    });
  });
}

/* =========================
   UPLOAD HELPER
========================= */
async function uploadFile(file, folder) {
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;

  const { data, error } = await supabaseClient.storage
    .from('media')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabaseClient.storage
    .from('media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

function mediaPathFromUrl(url) {
  const marker = '/storage/v1/object/public/media/';
  try {
    const parsed = new URL(String(url || ''));
    if (parsed.host !== new URL(SUPABASE_URL).host || !parsed.pathname.startsWith(marker)) return '';
    return decodeURIComponent(parsed.pathname.slice(marker.length));
  } catch {
    return '';
  }
}

async function removeMediaUrls(urls) {
  const paths = [...new Set((urls || []).map(mediaPathFromUrl).filter(Boolean))];
  if (!paths.length) return;
  const { error } = await supabaseClient.storage.from('media').remove(paths);
  if (error) throw error;
}

async function replaceSubItems(parentId, type) {
  const oldIds = allSubs.filter(s => s.parent_id === parentId).map(s => s.id);
  let insertedIds = [];

  if (type === 'drive_folder' && editingSubItems.length) {
    const subRows = editingSubItems.map((s, i) => ({
      parent_id: parentId,
      title: s.title || `Item ${i + 1}`,
      type: s.type || 'drive_video',
      source_url: s.source_url || '',
      embed_url: s.embed_url || '',
      folder_url: s.folder_url || '',
      sort_order: i,
    }));

    const { data, error } = await supabaseClient
      .from('portfolio_sub_items')
      .insert(subRows)
      .select('id');
    if (error) throw error;
    insertedIds = (data || []).map(row => row.id);
  }

  if (!oldIds.length) return;
  const { error } = await supabaseClient.from('portfolio_sub_items').delete().in('id', oldIds);
  if (!error) return;

  if (insertedIds.length) {
    await supabaseClient.from('portfolio_sub_items').delete().in('id', insertedIds);
  }
  throw error;
}

/* =========================
   SAVE ITEM (CREATE / UPDATE)
========================= */
itemForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const existingId = document.getElementById('itemId').value.trim();
  const title = document.getElementById('itemTitle').value.trim();
  let category = document.getElementById('itemCategory').value;
  if (category === '__new__') {
    category = (document.getElementById('itemCategoryNew')?.value || '').trim();
  }
  const type = document.getElementById('itemType').value;
  const sortOrder = parseInt(document.getElementById('itemSortOrder').value) || 0;
  const sourceUrl = document.getElementById('itemSourceUrl').value.trim();
  const embedUrl = document.getElementById('itemEmbedUrl').value.trim();
  const description = document.getElementById('itemDesc').value.trim();
  const tagsStr = document.getElementById('itemTags').value.trim();
  const tags = tagsStr
    ? [...new Set(tagsStr.split(',').map(t => t.trim()).filter(Boolean))]
    : [];
  const isFeatured = document.getElementById('itemFeatured').checked;

  let thumbnailUrl = document.getElementById('itemThumbUrl').value;
  let featuredThumb = document.getElementById('itemFeaturedThumbUrl').value;

  if (!title || !category || !type) {
    toast('Judul, kategori, dan tipe wajib diisi.', 'error');
    return;
  }

  // Generate ID for new items
  const id = existingId || generateId(category, title);
  const previousItem = existingId ? allItems.find(item => item.id === existingId) : null;
  const uploadedUrls = [];
  let rowSaved = false;

  // Disable submit button untuk mencegah double-submit
  const submitBtn = itemForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
  }

  try {
    // Upload thumbnail if pending
    if (pendingThumbFile) {
      thumbnailUrl = await uploadFile(pendingThumbFile, 'thumbnails');
      uploadedUrls.push(thumbnailUrl);
    }

    // Upload featured thumb if pending
    if (pendingFeaturedThumbFile) {
      featuredThumb = await uploadFile(pendingFeaturedThumbFile, 'featured');
      uploadedUrls.push(featuredThumb);
    }

    const row = {
      id,
      title,
      category,
      type,
      source_url: sourceUrl,
      embed_url: embedUrl,
      thumbnail_url: thumbnailUrl || '',
      description,
      tags,
      sort_order: sortOrder,
      is_featured: isFeatured,
      featured_thumb: featuredThumb || '',
    };

    const { error } = await supabaseClient
      .from('portfolio_items')
      .upsert(row, { onConflict: 'id' });

    if (error) throw error;
    rowSaved = true;

    await replaceSubItems(id, type);

    const replacedUrls = [];
    if (previousItem?.thumbnail_url && previousItem.thumbnail_url !== thumbnailUrl) {
      replacedUrls.push(previousItem.thumbnail_url);
    }
    if (previousItem?.featured_thumb && previousItem.featured_thumb !== featuredThumb) {
      replacedUrls.push(previousItem.featured_thumb);
    }
    try {
      await removeMediaUrls(replacedUrls);
    } catch (cleanupErr) {
      toast('Item tersimpan, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
    }

    toast(existingId ? 'Item berhasil diupdate!' : 'Item berhasil ditambahkan!');
    closeItemModal();
    await loadItems();

  } catch (err) {
    if (rowSaved) {
      if (previousItem) {
        await supabaseClient.from('portfolio_items').upsert(previousItem, { onConflict: 'id' });
      } else {
        await supabaseClient.from('portfolio_items').delete().eq('id', id);
      }
    }
    try {
      await removeMediaUrls(uploadedUrls);
    } catch {
      // Cleanup best-effort; original error remains the useful message.
    }
    toast('Error: ' + (err.message || err), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  }
});

function generateId(category, title) {
  const prefix = category.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 10);
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 15);
  return `${prefix}-${slug}-${Date.now().toString(36)}`;
}

/* =========================
   DELETE ITEM
========================= */
const deleteModal = document.getElementById('deleteModal');
const deleteItemName = document.getElementById('deleteItemName');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteModalClose = document.getElementById('deleteModalClose');

let deleteTargetId = null;

function openDeleteModal(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  deleteTargetId = id;
  if (deleteItemName) deleteItemName.textContent = item.title;
  deleteModal.style.display = 'flex';
}

deleteCancelBtn?.addEventListener('click', () => { deleteModal.style.display = 'none'; });
deleteModalClose?.addEventListener('click', () => { deleteModal.style.display = 'none'; });

deleteConfirmBtn?.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  const item = allItems.find(row => row.id === deleteTargetId);
  deleteConfirmBtn.disabled = true;
  deleteConfirmBtn.textContent = 'Menghapus...';

  try {
    // Sub-items cascade via FK ON DELETE CASCADE
    const { error } = await supabaseClient
      .from('portfolio_items')
      .delete()
      .eq('id', deleteTargetId);

    if (error) throw error;

    try {
      await removeMediaUrls([item?.thumbnail_url, item?.featured_thumb]);
    } catch (cleanupErr) {
      toast('Item terhapus, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
    }

    toast('Item berhasil dihapus.');
    deleteModal.style.display = 'none';
    deleteTargetId = null;
    await loadItems();

  } catch (err) {
    toast('Error hapus: ' + (err.message || err), 'error');
  } finally {
    deleteConfirmBtn.disabled = false;
    deleteConfirmBtn.textContent = 'Hapus';
  }
});

/* =========================
   SITE CONTENT (PROFILE PHOTOS)
========================= */
let siteContent = {};

async function loadSiteContent() {
  const { data, error } = await supabaseClient
    .from('site_content')
    .select('*');

  if (error) { toast('Gagal memuat settings: ' + error.message, 'error'); return; }

  siteContent = {};
  (data || []).forEach(r => { siteContent[r.key] = r.value; });

  // Update previews
  const previewHero = document.getElementById('previewHero');
  const previewAbout = document.getElementById('previewAbout');

  if (siteContent.profile_photo_hero && previewHero) {
    previewHero.src = siteContent.profile_photo_hero;
  }
  if (siteContent.profile_photo_about && previewAbout) {
    previewAbout.src = siteContent.profile_photo_about;
  }
}

function setupPhotoUploaders() {
  if (setupPhotoUploaders.initialized) return;
  setupPhotoUploaders.initialized = true;
  setupSingleUploader('dropHero', 'fileHero', 'previewHero', 'saveHero', 'profile_photo_hero', 'profile');
  setupSingleUploader('dropAbout', 'fileAbout', 'previewAbout', 'saveAbout', 'profile_photo_about', 'profile');
}

function setupSingleUploader(dropId, fileId, previewId, btnId, contentKey, folder) {
  const dropArea = document.getElementById(dropId);
  const fileInput = document.getElementById(fileId);
  const preview = document.getElementById(previewId);
  const saveBtn = document.getElementById(btnId);

  let selectedFile = null;

  // Click to open file picker
  dropArea?.addEventListener('click', () => fileInput?.click());

  // Drag & drop
  dropArea?.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('drag-over'); });
  dropArea?.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
  dropArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
  });

  function handleFileSelect(file) {
    if (file.size > MAX_FILE_SIZE) {
      toast('File terlalu besar! Maksimal 1 MB.', 'error');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast('Format gambar harus JPG, PNG, WebP, atau GIF.', 'error');
      return;
    }
    selectedFile = file;
    if (preview) preview.src = URL.createObjectURL(file);
    if (saveBtn) saveBtn.disabled = false;
  }

  // Save
  saveBtn?.addEventListener('click', async () => {
    if (!selectedFile) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Mengupload...';

    let uploadedUrl = '';
    try {
      const oldUrl = siteContent[contentKey] || '';
      const publicUrl = await uploadFile(selectedFile, folder);
      uploadedUrl = publicUrl;

      // Update site_content
      const { error } = await supabaseClient
        .from('site_content')
        .upsert({ key: contentKey, value: publicUrl }, { onConflict: 'key' });

      if (error) throw error;

      siteContent[contentKey] = publicUrl;
      try {
        await removeMediaUrls([oldUrl]);
      } catch (cleanupErr) {
        toast('Foto tersimpan, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
      }
      toast('Foto profil berhasil diupdate!');
      selectedFile = null;

    } catch (err) {
      try {
        await removeMediaUrls([uploadedUrl]);
      } catch {
        // Cleanup best-effort; original error remains the useful message.
      }
      if (preview && siteContent[contentKey]) preview.src = siteContent[contentKey];
      toast('Gagal upload: ' + (err.message || err), 'error');
    } finally {
      saveBtn.textContent = 'Upload & Simpan';
      saveBtn.disabled = !selectedFile;
    }
  });
}

/* =========================
   KEYBOARD: Escape closes modals
========================= */
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (itemModal?.style.display === 'flex') closeItemModal();
  if (deleteModal?.style.display === 'flex') deleteModal.style.display = 'none';
});
