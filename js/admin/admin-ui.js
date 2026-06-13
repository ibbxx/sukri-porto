import { esc, generateId, getYoutubeId, toast } from '../utils.js';
import { uploadFile, removeMediaUrls, upsertPortfolioItem, replaceSubItems, deletePortfolioItem, upsertSiteContent } from '../api.js';

/* =========================================================
   CONSTANTS & STATE
========================================================= */
const MAX_FILE_SIZE = 1048576; // 1 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let allItems = [];
let allSubs = [];
let filterCat = '';
let searchQ = '';
let siteContent = {};

export function setAdminData(items, subs, siteRows) {
  allItems = items;
  allSubs = subs;
  siteContent = {};
  (siteRows || []).forEach(r => { siteContent[r.key] = r.value; });
}

/* =========================================================
   TABS
========================================================= */
export function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabPortfolio = document.getElementById('tabPortfolio');
  const tabSettings = document.getElementById('tabSettings');
  const tabGuide = document.getElementById('tabGuide');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      const target = tab.dataset.tab;
      if (tabPortfolio) tabPortfolio.style.display = target === 'portfolio' ? 'block' : 'none';
      if (tabSettings) tabSettings.style.display = target === 'settings' ? 'block' : 'none';
      if (tabGuide) tabGuide.style.display = target === 'guide' ? 'block' : 'none';
    });
  });

  const defaultTab = document.querySelector('.tab[data-tab="portfolio"]');
  if (defaultTab) defaultTab.classList.add('is-active');
}

/* =========================================================
   CATEGORY HELPERS
========================================================= */
export function populateCategoryFilter() {
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
    "Long Video (YouTube)", "Project Video", "Short Video (IG)",
    "Bumper Event (IG)", "Feed Carousel (IG)", "Flyer (IG)", "Photo", "Poster Design"
  ];
  const allCats = [...new Set([...defaultCats, ...dbCats])];

  if (selectedVal && !allCats.includes(selectedVal)) {
    allCats.push(selectedVal);
  }

  let html = `<option value="">Pilih...</option>`;
  html += allCats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  html += `<option value="__new__" style="color: #10b981; font-weight: bold;">+ Tambah Kategori Baru...</option>`;
  sel.innerHTML = html;
  if (selectedVal) sel.value = selectedVal;
}

/* =========================================================
   RENDER ITEMS (Card List)
========================================================= */
export function renderItems(reloadCallback) {
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
          <div class="item-thumb-wrap">
            <div class="item-sort-badge">#${esc(item.sort_order ?? 0)}</div>
            ${thumbHtml}
          </div>
          <div class="item-content">
            <div class="item-title-row"><h4 title="${esc(item.title)}">${esc(item.title)}</h4></div>
            <div class="item-badges">
              <span class="badge-cat">${esc(item.category)}</span>
              <span class="badge-type">${esc(item.type)}</span>
              ${item.is_featured ? '<span class="badge-featured">★ Featured</span>' : ''}
              ${hasSubs ? `<span class="badge-subs">${subsCount} sub-item${subsCount > 1 ? 's' : ''}</span>` : ''}
            </div>
            <p class="item-desc">${esc(item.description || 'Tidak ada deskripsi.')}</p>
            ${(item.tags || []).length > 0 ? `<div class="item-tags">${item.tags.map(t => `<span class="item-tag">${esc(t)}</span>`).join('')}</div>` : ''}
          </div>
          <div class="item-actions">
            <button class="act-edit edit-btn" data-id="${esc(item.id)}">Edit</button>
            <button class="act-delete delete-btn" data-id="${esc(item.id)}">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = allItems.find(i => i.id === btn.dataset.id);
      if (item) openItemModal(item, reloadCallback);
    });
  });
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, reloadCallback));
  });
}

export function initFilterAndSearch(reloadCallback) {
  document.getElementById('filterCategory')?.addEventListener('change', (e) => {
    filterCat = e.target.value;
    renderItems(reloadCallback);
  });
  document.getElementById('searchItems')?.addEventListener('input', (e) => {
    searchQ = e.target.value;
    renderItems(reloadCallback);
  });
}

/* =========================================================
   UI TOGGLE (LIST / GRID)
========================================================= */
export function initViewToggle() {
  let isGridView = localStorage.getItem('adminGridView') === 'true';
  const toggleViewBtn = document.getElementById('toggleViewBtn');
  const viewIconList = document.getElementById('viewIconList');
  const viewIconGrid = document.getElementById('viewIconGrid');

  function updateViewUI() {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    if (isGridView) {
      grid.classList.add('grid-view');
      if (viewIconList) viewIconList.classList.remove('hidden');
      if (viewIconGrid) viewIconGrid.classList.add('hidden');
    } else {
      grid.classList.remove('grid-view');
      if (viewIconList) viewIconList.classList.add('hidden');
      if (viewIconGrid) viewIconGrid.classList.remove('hidden');
    }
  }

  toggleViewBtn?.addEventListener('click', () => {
    isGridView = !isGridView;
    localStorage.setItem('adminGridView', isGridView);
    updateViewUI();
  });
  updateViewUI();
}

/* =========================================================
   SHARED IMAGE PREVIEW HELPER (menghilangkan duplikasi)
========================================================= */
function updateImagePreview(previewId, removeBtnId, url) {
  const previewEl = document.getElementById(previewId);
  const removeBtn = document.getElementById(removeBtnId);
  if (!previewEl) return;

  if (url) {
    previewEl.innerHTML = `<img src="${esc(url)}" class="w-full h-full object-cover" alt="" />`;
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  } else {
    previewEl.innerHTML = `<span class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">No Image</span>`;
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

/* =========================================================
   SHARED IMAGE PICKER SETUP (menghilangkan duplikasi)
   Mengembalikan object { getFile, reset } untuk kontrol.
========================================================= */
function setupImagePicker({ fileInputId, pickBtnId, removeBtnId, previewId, onFileSelected }) {
  const fileInput = document.getElementById(fileInputId);
  const pickBtn = document.getElementById(pickBtnId);
  const removeBtn = document.getElementById(removeBtnId);

  let pendingFile = null;

  pickBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast('File terlalu besar! Max 1 MB.', 'error');
      fileInput.value = '';
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast('Format gambar harus JPG, PNG, WebP, atau GIF.', 'error');
      fileInput.value = '';
      return;
    }
    pendingFile = file;
    updateImagePreview(previewId, removeBtnId, URL.createObjectURL(file));
    if (onFileSelected) onFileSelected(file);
  });

  removeBtn?.addEventListener('click', () => {
    pendingFile = null;
    if (fileInput) fileInput.value = '';
    updateImagePreview(previewId, removeBtnId, null);
  });

  return {
    getFile: () => pendingFile,
    reset: () => {
      pendingFile = null;
      if (fileInput) fileInput.value = '';
    }
  };
}

/* =========================================================
   ITEM MODAL (ADD + EDIT digabung — menghilangkan duplikasi)
========================================================= */
let editingSubItems = [];
let thumbPicker = null;

/**
 * Auto-detect dan konversi URL ke embed & source berdasarkan tipe.
 * Dipanggil saat user memasukkan URL tunggal.
 */
function deriveUrlsFromInput(url, type) {
  const result = { source_url: '', embed_url: '' };
  if (!url) return result;

  result.source_url = url;

  if (type === 'youtube') {
    const ytId = getYoutubeId(url);
    if (ytId) {
      // Normalize source URL
      if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
        result.source_url = `https://www.youtube.com/watch?v=${ytId}`;
      }
      result.embed_url = `https://www.youtube.com/embed/${ytId}`;
    }
  }

  return result;
}

function autoFillThumbnailFromUrl() {
  const type = document.getElementById('itemType')?.value;
  const inputUrl = document.getElementById('itemUrl')?.value.trim() || '';
  const thumbUrlInput = document.getElementById('itemThumbUrl');

  if (type === 'youtube' && thumbPicker && !thumbPicker.getFile() && (!thumbUrlInput.value || thumbUrlInput.value.includes('img.youtube.com'))) {
    const ytId = getYoutubeId(inputUrl);
    if (ytId) {
      const computedThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      thumbUrlInput.value = computedThumb;
      updateImagePreview('thumbPreview', 'thumbRemoveBtn', computedThumb);
    }
  }
}

function updateTypeFields() {
  const type = document.getElementById('itemType')?.value;
  const subSection = document.getElementById('subItemsSection');
  const urlLabel = document.getElementById('urlLabel');

  if (subSection) subSection.style.display = type === 'drive_folder' ? 'block' : 'none';

  // Perbarui label URL sesuai tipe
  if (urlLabel) {
    const labels = {
      youtube: 'URL YouTube',
      link: 'URL (Instagram/Lainnya)',
      drive_folder: 'URL Google Drive Folder'
    };
    urlLabel.textContent = labels[type] || 'URL';
  }
}

function updateSubItemsUI() {
  const list = document.getElementById('subItemsList');
  if (!list) return;

  list.innerHTML = editingSubItems.map((sub, idx) => `
    <div class="flex flex-col gap-3 bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg mb-2 relative sub-item-row" data-idx="${idx}">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">URL</label>
          <input type="text" value="${esc(sub.folder_url || sub.source_url || sub.embed_url || '')}" data-field="url" placeholder="https://drive.google.com/..." class="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full" />
        </div>
      </div>
      <button type="button" class="absolute top-3 right-3 bg-transparent hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 w-7 h-7 rounded-md flex items-center justify-center transition-colors sub-remove-btn" data-idx="${idx}">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('input, select').forEach(inp => {
    const evtType = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(evtType, () => {
      const row = inp.closest('.sub-item-row');
      const idx = parseInt(row.dataset.idx);
      const field = inp.dataset.field;
      if (!editingSubItems[idx]) return;

      if (field === 'url') {
        // Simpan ke source_url, embed_url, dan folder_url sekaligus
        editingSubItems[idx].source_url = inp.value;
        editingSubItems[idx].embed_url = inp.value;
        editingSubItems[idx].folder_url = inp.value;
      } else {
        editingSubItems[idx][field] = inp.value;
      }
    });
  });

  list.querySelectorAll('.sub-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingSubItems.splice(parseInt(btn.dataset.idx), 1);
      updateSubItemsUI();
    });
  });
}

/**
 * Membuka modal Add/Edit dalam SATU fungsi.
 * Jika `item` adalah null → mode Tambah.
 * Jika `item` berisi data → mode Edit.
 */
function openItemModal(item = null, reloadCallback) {
  const isEdit = !!item;
  const itemModal = document.getElementById('itemModal');
  const itemForm = document.getElementById('itemForm');
  const modalTitleEl = document.getElementById('modalTitle');

  // Reset form
  itemForm.reset();
  modalTitleEl.textContent = isEdit ? 'Edit Item' : 'Tambah Item';

  // Category dropdown reset
  const catNew = document.getElementById('itemCategoryNew');
  if (catNew) {
    catNew.classList.add('hidden');
    catNew.value = '';
    catNew.required = false;
  }
  const catSel = document.getElementById('itemCategory');
  if (catSel) catSel.required = true;

  // Isi field
  document.getElementById('itemId').value = isEdit ? item.id : '';
  document.getElementById('itemTitle').value = isEdit ? (item.title || '') : '';
  populateCategoryDropdown(isEdit ? (item.category || '') : '');
  document.getElementById('itemType').value = isEdit ? (item.type || 'link') : 'youtube';
  document.getElementById('itemSortOrder').value = isEdit ? (item.sort_order ?? 0) : allItems.length;

  // URL tunggal: ambil source_url atau embed_url
  const urlValue = isEdit ? (item.source_url || item.embed_url || '') : '';
  document.getElementById('itemUrl').value = urlValue;

  document.getElementById('itemDesc').value = isEdit ? (item.description || '') : '';

  const tagsArray = isEdit
    ? (Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : []))
    : [];
  document.getElementById('itemTags').value = tagsArray.join(', ');

  document.getElementById('itemFeatured').checked = isEdit ? !!item.is_featured : false;

  // Thumbnail
  let thumbUrl = isEdit ? (item.thumbnail_url || '') : '';
  if (!thumbUrl && isEdit && item.type === 'youtube') {
    const ytId = getYoutubeId(item.source_url || item.embed_url);
    if (ytId) thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  document.getElementById('itemThumbUrl').value = thumbUrl;
  if (thumbPicker) thumbPicker.reset();
  updateImagePreview('thumbPreview', 'thumbRemoveBtn', thumbUrl || null);

  // Sub-items
  editingSubItems = isEdit
    ? allSubs.filter(s => s.parent_id === item.id).map(s => ({ ...s }))
    : [];

  updateSubItemsUI();
  updateTypeFields();

  itemModal.style.display = 'flex';
}

function closeItemModal() {
  document.getElementById('itemModal').style.display = 'none';
}

/* =========================================================
   INIT ITEM MODAL EVENTS (satu kali saat boot)
========================================================= */
export function initItemModalEvents(reloadCallback) {
  // Tombol buka modal (Add)
  document.getElementById('addItemBtn')?.addEventListener('click', () => openItemModal(null, reloadCallback));
  document.getElementById('modalClose')?.addEventListener('click', closeItemModal);
  document.getElementById('cancelFormBtn')?.addEventListener('click', closeItemModal);

  // Tipe berubah → update field
  document.getElementById('itemType')?.addEventListener('change', () => {
    updateTypeFields();
    autoFillThumbnailFromUrl();
  });

  // URL input → auto-fill thumbnail
  document.getElementById('itemUrl')?.addEventListener('input', autoFillThumbnailFromUrl);

  // Kategori baru
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

  // Sub-item tambah
  document.getElementById('addSubItemBtn')?.addEventListener('click', () => {
    editingSubItems.push({ title: '', type: 'drive_video', source_url: '', embed_url: '' });
    updateSubItemsUI();
  });

  // Thumbnail picker (satu instance, bukan duplikat)
  thumbPicker = setupImagePicker({
    fileInputId: 'thumbFile',
    pickBtnId: 'thumbPickBtn',
    removeBtnId: 'thumbRemoveBtn',
    previewId: 'thumbPreview',
    onFileSelected: () => {
      // Saat file dipilih manual, kosongkan URL auto-fill
      document.getElementById('itemThumbUrl').value = '';
    }
  });

  // Saat remove button diklik, juga kosongkan hidden URL
  document.getElementById('thumbRemoveBtn')?.addEventListener('click', () => {
    document.getElementById('itemThumbUrl').value = '';
  });

  // === SAVE LOGIC ===
  document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const existingId = document.getElementById('itemId').value.trim();
    const title = document.getElementById('itemTitle').value.trim();
    let category = document.getElementById('itemCategory').value;
    if (category === '__new__') category = (document.getElementById('itemCategoryNew')?.value || '').trim();
    const type = document.getElementById('itemType').value;
    const sortOrder = parseInt(document.getElementById('itemSortOrder').value) || 0;
    const rawUrl = document.getElementById('itemUrl').value.trim();
    const description = document.getElementById('itemDesc').value.trim();
    const tagsStr = document.getElementById('itemTags').value.trim();
    const tags = tagsStr ? [...new Set(tagsStr.split(',').map(t => t.trim()).filter(Boolean))] : [];
    const isFeatured = document.getElementById('itemFeatured').checked;

    // Derive source_url & embed_url dari satu input
    const { source_url: sourceUrl, embed_url: embedUrl } = deriveUrlsFromInput(rawUrl, type);

    let thumbnailUrl = document.getElementById('itemThumbUrl').value;

    if (!title || !category || !type) {
      toast('Judul, kategori, dan tipe wajib diisi.', 'error');
      return;
    }

    const id = existingId || generateId(category, title);
    const previousItem = existingId ? allItems.find(item => item.id === existingId) : null;
    const uploadedUrls = [];
    let rowSaved = false;

    const submitBtn = document.getElementById('itemForm').querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Menyimpan...'; }

    try {
      // Upload thumbnail jika ada file baru
      if (thumbPicker.getFile()) {
        thumbnailUrl = await uploadFile(thumbPicker.getFile(), 'thumbnails');
        uploadedUrls.push(thumbnailUrl);
      }

      // Featured thumb = sama dengan thumbnail utama
      const featuredThumb = isFeatured ? thumbnailUrl : '';

      const row = {
        id, title, category, type,
        source_url: sourceUrl,
        embed_url: embedUrl,
        thumbnail_url: thumbnailUrl || '',
        description, tags, sort_order: sortOrder,
        is_featured: isFeatured,
        featured_thumb: featuredThumb,
      };

      await upsertPortfolioItem(row);
      rowSaved = true;

      await replaceSubItems(id, type, editingSubItems, allSubs);

      // Bersihkan media lama yang sudah diganti
      const replacedUrls = [];
      if (previousItem?.thumbnail_url && previousItem.thumbnail_url !== thumbnailUrl) replacedUrls.push(previousItem.thumbnail_url);
      if (previousItem?.featured_thumb && previousItem.featured_thumb !== featuredThumb) replacedUrls.push(previousItem.featured_thumb);

      try {
        await removeMediaUrls(replacedUrls);
      } catch (cleanupErr) {
        toast('Item tersimpan, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
      }

      toast(existingId ? 'Item berhasil diupdate!' : 'Item berhasil ditambahkan!');
      closeItemModal();
      await reloadCallback();

    } catch (err) {
      // Rollback
      if (rowSaved) {
        if (previousItem) {
          await upsertPortfolioItem(previousItem);
        } else {
          await deletePortfolioItem(id);
        }
      }
      try { await removeMediaUrls(uploadedUrls); } catch {}
      toast('Error: ' + (err.message || err), 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan'; }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeItemModal();
  });
}

/* =========================================================
   DELETE ITEM
========================================================= */
let deleteTargetId = null;

function openDeleteModal(id, reloadCallback) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  deleteTargetId = id;
  const deleteItemName = document.getElementById('deleteItemName');
  if (deleteItemName) deleteItemName.textContent = item.title;
  document.getElementById('deleteModal').style.display = 'flex';
}

export function initDeleteModalEvents(reloadCallback) {
  const deleteModal = document.getElementById('deleteModal');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

  document.getElementById('deleteCancelBtn')?.addEventListener('click', () => deleteModal.style.display = 'none');
  document.getElementById('deleteModalClose')?.addEventListener('click', () => deleteModal.style.display = 'none');

  deleteConfirmBtn?.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    const item = allItems.find(row => row.id === deleteTargetId);
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = 'Menghapus...';

    try {
      await deletePortfolioItem(deleteTargetId);
      try {
        await removeMediaUrls([item?.thumbnail_url, item?.featured_thumb]);
      } catch (cleanupErr) {
        toast('Item terhapus, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
      }

      toast('Item berhasil dihapus.');
      deleteModal.style.display = 'none';
      deleteTargetId = null;
      await reloadCallback();
    } catch (err) {
      toast('Error hapus: ' + (err.message || err), 'error');
    } finally {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = 'Hapus';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') deleteModal.style.display = 'none';
  });
}

/* =========================================================
   SITE CONTENT (PROFILE PHOTOS)
========================================================= */
export function updateSiteContentUI() {
  const previewHero = document.getElementById('previewHero');
  const previewAbout = document.getElementById('previewAbout');

  if (siteContent.profile_photo_hero && previewHero) {
    previewHero.src = siteContent.profile_photo_hero;
  }
  if (siteContent.profile_photo_about && previewAbout) {
    previewAbout.src = siteContent.profile_photo_about;
  }
}

export function setupPhotoUploaders() {
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

  dropArea?.addEventListener('click', () => fileInput?.click());
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
    if (file.size > MAX_FILE_SIZE) { toast('File terlalu besar! Maksimal 1 MB.', 'error'); return; }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) { toast('Format gambar harus JPG, PNG, WebP, atau GIF.', 'error'); return; }
    selectedFile = file;
    if (preview) preview.src = URL.createObjectURL(file);
    if (saveBtn) saveBtn.disabled = false;
  }

  saveBtn?.addEventListener('click', async () => {
    if (!selectedFile) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Mengupload...';

    let uploadedUrl = '';
    try {
      const oldUrl = siteContent[contentKey] || '';
      const publicUrl = await uploadFile(selectedFile, folder);
      uploadedUrl = publicUrl;

      await upsertSiteContent(contentKey, publicUrl);
      siteContent[contentKey] = publicUrl;

      try { await removeMediaUrls([oldUrl]); } catch (cleanupErr) {
        toast('Foto tersimpan, tetapi media lama gagal dibersihkan: ' + cleanupErr.message, 'error');
      }
      toast('Foto profil berhasil diupdate!');
      selectedFile = null;

    } catch (err) {
      try { await removeMediaUrls([uploadedUrl]); } catch {}
      if (preview && siteContent[contentKey]) preview.src = siteContent[contentKey];
      toast('Gagal upload: ' + (err.message || err), 'error');
    } finally {
      saveBtn.textContent = 'Upload & Simpan';
      saveBtn.disabled = !selectedFile;
    }
  });
}
