/* =========================================================
   MOUSE GLOW (CSS vars) - throttled via rAF
========================================================= */
(() => {
  let raf = 0;
  window.addEventListener("mousemove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mx", `${x}%`);
      document.documentElement.style.setProperty("--my", `${y}%`);
    });
  });
})();

/* =========================================================
   DATA — diisi dari Supabase (atau cache)
========================================================= */
let portfolioData = [];
let FEATURED_IDS = [];
let FEATURED_THUMBS = {};
let openModalCount = 0;

/* =========================================================
   SUPABASE DATA FETCH + CACHE
========================================================= */
const CACHE_KEY_PORTFOLIO = 'portfolio_cache';
const CACHE_KEY_SUBS = 'portfolio_subs_cache';
const CACHE_KEY_SITE = 'site_content_cache';

async function loadPortfolioData() {
  try {
    if (!supabaseClient) throw new Error('Supabase SDK tidak termuat atau tidak terinisialisasi.');
    // Fetch portfolio items
    const { data: items, error: itemsErr } = await supabaseClient
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (itemsErr) throw itemsErr;

    // Fetch sub-items
    const { data: subs, error: subsErr } = await supabaseClient
      .from('portfolio_sub_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (subsErr) throw subsErr;

    // Fetch site content
    const { data: siteRows, error: siteErr } = await supabaseClient
      .from('site_content')
      .select('*');

    if (siteErr) throw siteErr;

    // Cache
    localStorage.setItem(CACHE_KEY_PORTFOLIO, JSON.stringify(items));
    localStorage.setItem(CACHE_KEY_SUBS, JSON.stringify(subs));
    localStorage.setItem(CACHE_KEY_SITE, JSON.stringify(siteRows));

    buildPortfolioData(items, subs);
    applySiteContent(siteRows);

  } catch (err) {
    console.warn('⚠️ Supabase fetch gagal, memakai cache:', err.message || err);
    loadFromCache();
  }
}

function loadFromCache() {
  try {
    const items = JSON.parse(localStorage.getItem(CACHE_KEY_PORTFOLIO) || '[]');
    const subs = JSON.parse(localStorage.getItem(CACHE_KEY_SUBS) || '[]');
    const site = JSON.parse(localStorage.getItem(CACHE_KEY_SITE) || '[]');
    buildPortfolioData(items, subs);
    applySiteContent(site);
  } catch {
    console.error('❌ Tidak ada data cache tersedia.');
  }
}

function buildPortfolioData(items, subs) {
  // Group sub-items by parent_id
  const subsMap = {};
  (subs || []).forEach(s => {
    if (!subsMap[s.parent_id]) subsMap[s.parent_id] = [];
    subsMap[s.parent_id].push(s);
  });

  portfolioData = (items || []).map(row => {
    const sourceUrl = safeUrl(row.source_url);
    const embedUrl = safeUrl(row.embed_url);
    let thumb = safeUrl(row.thumbnail_url);
    if (!thumb && row.type === 'youtube') {
      const ytId = getYoutubeId(sourceUrl || embedUrl);
      if (ytId) {
        thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
    if (
      (!thumb || String(thumb).includes('via.placeholder.com')) &&
      sourceUrl.includes('instagram.com/p/')
    ) {
      thumb = guessIgThumb(sourceUrl);
    }

    const item = {
      id: row.id,
      title: row.title,
      category: row.category,
      type: row.type,
      sourceUrl,
      embedUrl,
      thumbnailUrl: thumb,
      description: row.description || '',
      tags: row.tags || [],
    };

    // Attach sub-items for drive_folder
    if (row.type === 'drive_folder' && subsMap[row.id]) {
      item.items = subsMap[row.id].map(sub => ({
        title: sub.title,
        type: sub.type || 'drive_video',
        sourceUrl: safeUrl(sub.source_url),
        embedUrl: safeUrl(sub.embed_url),
        folderUrl: safeUrl(sub.folder_url),
      }));
    }

    return item;
  });

  // Build featured
  FEATURED_IDS = [];
  FEATURED_THUMBS = {};
  (items || []).forEach(row => {
    if (row.is_featured) {
      FEATURED_IDS.push(row.id);
      if (row.featured_thumb) {
        FEATURED_THUMBS[row.id] = safeUrl(row.featured_thumb);
      }
    }
  });
}

function applySiteContent(rows) {
  if (!rows || !rows.length) return;
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });

  // Update profile photos
  if (map.profile_photo_hero) {
    const el = document.getElementById('profileHero');
    const url = safeUrl(map.profile_photo_hero);
    if (el && url) el.src = url;
  }
  if (map.profile_photo_about) {
    const el = document.getElementById('profileAbout');
    const url = safeUrl(map.profile_photo_about);
    if (el && url) el.src = url;
  }
}

/* =========================================================
   UTILITIES
========================================================= */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m])
  );
}
function escapeAttr(str) {
  return escapeHtml(str);
}

function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function getYoutubeId(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
}

function getIgShortcode(url) {
  const m = String(url || "").match(/instagram\.com\/p\/([^\/\?\#]+)/i);
  return m ? m[1] : "";
}
function guessIgThumb(url) {
  const code = getIgShortcode(url);
  return code ? `https://www.instagram.com/p/${code}/media/?size=l` : "";
}

function featuredSecondLine(item) {
  const tags = (item.tags || []).filter(Boolean);
  if (tags.length) return tags.slice(0, 4).join(" • ");
  const d = (item.description || "").trim();
  if (!d) return "Klik untuk preview";
  return d.length > 64 ? d.slice(0, 64) + "…" : d;
}

function getFeaturedItems() {
  return FEATURED_IDS.map((id) => portfolioData.find((x) => x.id === id))
    .filter(Boolean)
    .map((it) => {
      const cloned = { ...it };

      // 1) Manual thumbs PRIORITAS
      if (FEATURED_THUMBS[cloned.id]) cloned.thumbnailUrl = FEATURED_THUMBS[cloned.id];

      // 2) Best-effort IG thumb (HANYA kalau belum ada thumb / placeholder)
      const isIG =
        String(cloned.category || "").includes("(IG)") &&
        cloned.sourceUrl &&
        String(cloned.sourceUrl).includes("instagram.com/p/");
      const looksPlaceholder =
        !cloned.thumbnailUrl || String(cloned.thumbnailUrl).includes("via.placeholder.com");
      if (isIG && looksPlaceholder && !FEATURED_THUMBS[cloned.id]) {
        const g = guessIgThumb(cloned.sourceUrl);
        if (g) cloned.thumbnailUrl = g;
      }

      return cloned;
    });
}

/* =========================================================
   UI CONFIG (thumbnail per kategori)
========================================================= */
function shouldShowThumb(item) {
  if (!item.thumbnailUrl) return false;
  // Jangan tampilkan placeholder
  if (String(item.thumbnailUrl).includes('via.placeholder.com')) return false;
  return true;
}

/* =========================================================
   INTERACTIONS: Tilt & Magnetic (reusable)
========================================================= */
function attachTiltTo(selector) {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((card) => {
    if (card.dataset.tiltBound === "1") return;
    card.dataset.tiltBound = "1";

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rx = (y / rect.height - 0.5) * -10;
      const ry = (x / rect.width - 0.5) * 12;

      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    };

    const onLeave = () => {
      card.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
  });
}

function attachMagneticTo(selector) {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((btn) => {
    if (btn.dataset.magnetBound === "1") return;
    btn.dataset.magnetBound = "1";

    let rect;
    const move = (e) => {
      rect = rect || btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    };
    const leave = () => {
      rect = null;
      btn.style.transform = "translate(0px, 0px)";
    };

    btn.addEventListener("mousemove", move);
    btn.addEventListener("mouseleave", leave);
  });
}

/* =========================================================
   PORTFOLIO GRID + FILTERS + SEARCH
========================================================= */
const grid = document.getElementById("portfolioGrid");
const filtersWrap = document.getElementById("filters");
const searchInput = document.getElementById("searchInput");

let searchQuery = "";
let categories = [];
let activeCategory = "";

function rebuildCategories() {
  categories = Array.from(new Set(portfolioData.map((x) => x.category)));
  activeCategory = "";
}

function renderFilters() {
  if (!filtersWrap) return;

  if (!categories.length) {
    filtersWrap.innerHTML = `<div class="tag">No categories</div>`;
    return;
  }

  filtersWrap.innerHTML = ["", ...categories]
    .map(
      (cat) => `
      <div class="filter-control">
        <button class="filter-btn ${cat === activeCategory ? "is-active" : ""}" data-cat="${escapeAttr(cat)}">
          ${escapeHtml(cat || "Semua")}
        </button>
        ${cat ? `
          <button class="category-open-btn" data-open-cat="${escapeAttr(cat)}"
            aria-label="Buka slider ${escapeAttr(cat)}" title="Buka slider kategori">↗</button>
        ` : ""}
      </div>
    `
    )
    .join("");
}

function renderThumb(item) {
  if (!shouldShowThumb(item)) return "";

  return `
    <div class="work-thumb-mini">
      <img
        src="${escapeAttr(item.thumbnailUrl)}"
        alt="${escapeAttr(item.title)}"
        loading="lazy"
        onerror="
          this.onerror=null;
          const wrap=this.closest('.work-thumb-mini');
          if(wrap) wrap.remove();
          const card=this.closest('.work-item');
          if(card) card.classList.add('no-thumb');
        "
      />
    </div>
  `;
}

function renderGrid() {
  if (!grid) return;

  const items = portfolioData.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const catOk = !activeCategory ? true : item.category === activeCategory;
    const qOk =
      !q ||
      (
        (item.title || "") +
        " " +
        (item.description || "") +
        " " +
        (item.tags || []).join(" ")
      )
        .toLowerCase()
        .includes(q);
    return catOk && qOk;
  });

  grid.innerHTML = items
    .map(
      (item) => `
      <article class="work-item glass tilt ${shouldShowThumb(item) ? "" : "no-thumb"}"
        data-id="${escapeAttr(item.id)}" role="button" tabindex="0"
        aria-label="Buka ${escapeAttr(item.title)}">
        ${renderThumb(item)}
        <div class="work-meta">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          <div class="work-tags">
            <span class="tag">${escapeHtml(item.category)}</span>
            ${(item.tags || [])
              .slice(0, 3)
              .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
              .join("")}
          </div>
        </div>
      </article>
    `
    )
    .join("");

  attachTiltTo(".work-item.tilt");
}

/* =========================================================
   MODAL (single item preview)
========================================================= */
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalBody = document.getElementById("modalBody");
const modalOpenLink = document.getElementById("modalOpenLink");

function openModal(item) {
  if (!modal || !modalBody) return;

  if (modalTitle) modalTitle.textContent = item.title || "";
  if (modalCategory) modalCategory.textContent = item.category || "";
  if (modalOpenLink) modalOpenLink.href = item.sourceUrl || item.embedUrl || "#";

  // Render tags di modal head
  const modalHead = modal.querySelector('.modal-head');
  const existingTags = modalHead?.querySelector('.modal-tags');
  if (existingTags) existingTags.remove();
  if (item.tags && item.tags.length) {
    const tagsHtml = document.createElement('div');
    tagsHtml.className = 'modal-tags';
    tagsHtml.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;';
    tagsHtml.innerHTML = item.tags
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('');
    const headLeft = modalHead?.querySelector('div');
    if (headLeft) headLeft.appendChild(tagsHtml);
  }

  modalBody.innerHTML = "";
  modalBody.style.maxHeight = "";
  modalBody.style.overflow = "";
  modalBody.style.webkitOverflowScrolling = "";

  // reset IG style
  modal.classList.remove("modal--ig");
  modalBody.classList.remove("modal-body--ig");

  /* 1) YouTube */
  if (item.type === "youtube" && item.embedUrl) {
    modalBody.innerHTML = `
      <iframe
        src="${escapeAttr(item.embedUrl)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    `;
  }
  /* 2) Drive */
  else if ((item.type === "drive_video" || item.type === "drive_image") && item.embedUrl) {
    modalBody.innerHTML = `
      <iframe src="${escapeAttr(item.embedUrl)}" loading="lazy" allow="autoplay" allowfullscreen></iframe>
    `;
  }
  /* 3) Instagram (link/embed) */
  else if (
    (item.type === "instagram_embed" || item.type === "link") &&
    item.sourceUrl &&
    String(item.sourceUrl).includes("instagram.com/")
  ) {
    modal.classList.add("modal--ig");
    modalBody.classList.add("modal-body--ig");

    modalBody.style.overflow = "auto";
    modalBody.style.webkitOverflowScrolling = "touch";

    modalBody.innerHTML = `
      <div class="ig-embed-wrap" style="padding:12px;">
        <blockquote
          class="instagram-media"
          data-instgrm-permalink="${escapeAttr(item.sourceUrl)}"
          data-instgrm-version="14"
          style="margin:0; width:100%; max-width:100%;"></blockquote>
      </div>
    `;

    const processIg = () => {
      if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
    };
    setTimeout(() => {
      processIg();
      setTimeout(processIg, 350);
    }, 50);
  }
  /* 4) Fallback */
  else {
    modalBody.innerHTML = `
      <div class="modal-placeholder">
        Preview tidak tersedia untuk tipe ini. Klik tombol "Open Source Link".
      </div>
    `;
  }

  if (!modal.classList.contains("is-open")) openModalCount++;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal || !modal.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  // Hapus tags di modal head
  const existingTags = modal.querySelector('.modal-tags');
  if (existingTags) existingTags.remove();

  if (modalBody) {
    modal.classList.remove("modal--ig");
    modalBody.classList.remove("modal-body--ig");
    modalBody.style.maxHeight = "";
    modalBody.style.overflow = "";
    modalBody.style.webkitOverflowScrolling = "";
    modalBody.innerHTML = "";
  }
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) document.body.style.overflow = "";
}

/* =========================================================
   CATEGORY MODAL (SLIDER) + PROJECT FOLDER MODAL
========================================================= */
const catModal = document.getElementById("catModal");
const catBackdrop = document.getElementById("catBackdrop");
const catClose = document.getElementById("catClose");
const catPrev = document.getElementById("catPrev");
const catNext = document.getElementById("catNext");
const catTitle = document.getElementById("catTitle");
const catTitleBadge = document.getElementById("catTitleBadge");
const catTrack = document.getElementById("catTrack");
const catCounter = document.getElementById("catCounter");
const catOpenLink = document.getElementById("catOpenLink");

let catItems = [];
let activeIndex = 0;
let catMediaBuilder = buildSlideMedia;

function processInstagramEmbeds() {
  if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
}

function ensureSlideMedia(index) {
  if (!catTrack || !catItems[index]) return;
  const slot = catTrack.querySelector(`.slide[data-idx="${index}"] .slide-media-slot`);
  if (!slot || slot.dataset.hydrated === "1") return;
  slot.innerHTML = catMediaBuilder(catItems[index]);
  slot.dataset.hydrated = "1";
  processInstagramEmbeds();
}

function buildSlideMedia(item) {
  if (item.type === "youtube" && item.embedUrl) {
    return `<iframe class="slide-media" src="${escapeAttr(item.embedUrl)}" loading="lazy" allowfullscreen></iframe>`;
  }
  if ((item.type === "drive_video" || item.type === "drive_image") && item.embedUrl) {
    return `<iframe class="slide-media" src="${escapeAttr(item.embedUrl)}" loading="lazy" allow="autoplay" allowfullscreen></iframe>`;
  }

  if (
    (item.type === "instagram_embed" || item.type === "link") &&
    item.sourceUrl &&
    String(item.sourceUrl).includes("instagram.com/p/")
  ) {
    return `
      <div class="slide-media" style="height:auto; padding:14px;">
        <blockquote class="instagram-media"
          data-instgrm-permalink="${escapeAttr(item.sourceUrl)}"
          data-instgrm-version="14"></blockquote>
      </div>
    `;
  }

  return `
    <div class="slide-media" style="display:grid; place-items:center;">
      <div style="padding:18px; text-align:center;">
        <div style="color: rgba(235,235,245,.7); font-weight:700;">Preview not embedded</div>
        <div style="margin-top:8px; color: rgba(235,235,245,.55); font-size:12px; line-height:1.6;">
          Klik "Open Selected Link" untuk melihat konten.
        </div>
      </div>
    </div>
  `;
}

function updateCatUI() {
  const total = catItems.length || 1;
  if (catCounter) catCounter.textContent = `${activeIndex + 1} / ${total}`;
  const current = catItems[activeIndex];
  if (catOpenLink) catOpenLink.href = current?.folderUrl || current?.sourceUrl || current?.embedUrl || "#";
  ensureSlideMedia(activeIndex);
}

function snapTo(index, smooth = true) {
  if (!catTrack) return;
  const slide = catTrack.querySelector(`.slide[data-idx="${index}"]`);
  if (!slide) return;
  slide.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    inline: "center",
    block: "nearest",
  });
}

function openCategoryModal(category) {
  if (!catModal || !catTrack) return;

  catItems = portfolioData.filter((x) => x.category === category);
  if (!catItems.length) return;
  catMediaBuilder = buildSlideMedia;
  activeIndex = 0;

  if (catTitleBadge) catTitleBadge.textContent = "Category";
  if (catTitle) catTitle.textContent = category;

  catTrack.innerHTML = catItems
    .map((item, idx) => {
      return `
        <div class="slide" data-idx="${idx}">
          <div class="slide-media-slot" data-hydrated="${idx === 0 ? "1" : "0"}">
            ${idx === 0 ? buildSlideMedia(item) : '<div class="slide-media slide-media--placeholder">Geser untuk memuat preview</div>'}
          </div>
          <div class="slide-meta">
            <div>
              <div class="slide-title">${escapeHtml(item.title)}</div>
              <div class="slide-desc">${escapeHtml(item.description || "")}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;">
              <div class="slide-cat-badge tag">${escapeHtml(item.category)}</div>
              ${(item.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  if (!catModal.classList.contains("is-open")) openModalCount++;
  catModal.classList.add("is-open");
  catModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  processInstagramEmbeds();

  updateCatUI();
  snapTo(activeIndex, false);
}

function closeCategoryModal() {
  if (!catModal || !catModal.classList.contains("is-open")) return;
  catModal.classList.remove("is-open");
  catModal.setAttribute("aria-hidden", "true");
  if (catTrack) catTrack.innerHTML = "";
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) document.body.style.overflow = "";
}

function buildFolderSlideMedia(it) {
  if (it.type === "drive_subfolder") {
    return `
      <div class="slide-media" style="display:grid; place-items:center; padding:22px;">
        <div style="text-align:center; max-width:520px;">
          <div style="font-weight:850; font-size:18px; margin-bottom:8px;">
            ${escapeHtml(it.title)}
          </div>
          <div style="color: rgba(235,235,245,.65); font-size:13px; line-height:1.6;">
            Klik tombol di bawah untuk membuka dan melihat daftar file.
          </div>
          <div style="margin-top:14px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <a class="btn btn--ghost" href="${escapeAttr(it.folderUrl)}" target="_blank" rel="noopener">
              Buka Folder
              <span class="btn-glow"></span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  if ((it.type === "drive_video" || it.type === "drive_image") && it.embedUrl) {
    return `<iframe class="slide-media" src="${escapeAttr(it.embedUrl)}" loading="lazy" allow="autoplay" allowfullscreen></iframe>`;
  }

  const link = it.sourceUrl || it.folderUrl || "#";
  return `
    <div class="slide-media" style="display:grid; place-items:center; padding:18px; text-align:center;">
      <div style="color: rgba(235,235,245,.7); font-weight:700;">Preview tidak tersedia</div>
      <div style="margin-top:8px; color: rgba(235,235,245,.55); font-size:12px; line-height:1.6;">
        Klik "Open Selected Link" untuk membuka.
      </div>
      <div style="margin-top:12px;">
        <a class="btn btn--ghost" href="${escapeAttr(link)}" target="_blank" rel="noopener">
          Buka Link
          <span class="btn-glow"></span>
        </a>
      </div>
    </div>
  `;
}

function openProjectFolderModal(folder) {
  // kalau tidak ada modal slider, fallback buka tab baru
  if (!catModal || !catTrack) {
    window.open(folder.sourceUrl, "_blank", "noopener");
    return;
  }

  if (!folder.items || !folder.items.length) {
    window.open(folder.sourceUrl, "_blank", "noopener");
    return;
  }

  catItems = folder.items.map((x, i) => ({
    id: `${folder.id}-item-${i}`,
    title: x.title || `Item #${i + 1}`,
    category: folder.title,
    type: x.type || "drive_video",
    folderUrl: x.folderUrl || "",
    sourceUrl: x.sourceUrl || "",
    embedUrl: x.embedUrl || "",
    description: folder.description,
    tags: folder.tags,
  }));
  catMediaBuilder = buildFolderSlideMedia;

  activeIndex = 0;

  if (catTitleBadge) catTitleBadge.textContent = "Folder";
  if (catTitle) catTitle.textContent = folder.title;

  catTrack.innerHTML = catItems
    .map(
      (it, idx) => `
        <div class="slide" data-idx="${idx}">
          <div class="slide-media-slot" data-hydrated="${idx === 0 ? "1" : "0"}">
            ${idx === 0 ? buildFolderSlideMedia(it) : '<div class="slide-media slide-media--placeholder">Geser untuk memuat preview</div>'}
          </div>
          <div class="slide-meta">
            <div>
              <div class="slide-title">${escapeHtml(it.title)}</div>
              <div class="slide-desc">${escapeHtml(it.description || "")}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;">
              <div class="slide-cat-badge tag">${escapeHtml(folder.category)}</div>
              ${(folder.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
        </div>
      `
    )
    .join("");

  if (!catModal.classList.contains("is-open")) openModalCount++;
  catModal.classList.add("is-open");
  catModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  updateCatUI();
  snapTo(activeIndex, false);
}

/* =========================================================
   FEATURED (AUTO-DETECT: marquee OR slider transform)
========================================================= */
function buildFeaturedCard(item) {
  const thumb = (item.thumbnailUrl || "").trim();

  return `
    <article class="featured-card tilt" data-id="${escapeAttr(item.id)}" role="button" tabindex="0"
      aria-label="Buka ${escapeAttr(item.title)}">
      <div class="featured-badge">${escapeHtml(item.category || "Featured")}</div>

      <div class="featured-media ${thumb ? "" : "is-empty"}">
        ${thumb ? `
          <img src="${escapeAttr(thumb)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.remove();this.parentElement.classList.add('is-empty')" />
        ` : ""}
      </div>

      <div class="featured-overlay">
        <div class="featured-kicker">${escapeHtml(item.title)}</div>
        <div class="featured-line">${escapeHtml(featuredSecondLine(item))}</div>
      </div>
    </article>
  `;
}

function initFeatured() {
  const track = document.getElementById("featuredTrack");
  if (!track) return;

  const marquee = document.getElementById("featuredMarquee"); // layout marquee
  const viewport = document.getElementById("featuredViewport"); // layout slider
  const dots = document.getElementById("featuredDots");
  const prevBtn = document.querySelector(".f-prev");
  const nextBtn = document.querySelector(".f-next");

  const baseItems = getFeaturedItems();
  if (!baseItems.length) {
    track.innerHTML = `<div style="padding:12px; color:rgba(235,235,245,.7)">Featured list kosong.</div>`;
    return;
  }

  // ✅ pilih satu sistem saja: marquee punya prioritas
  if (marquee) {
    const loopItems = baseItems.concat(baseItems);
    track.innerHTML = loopItems.map(buildFeaturedCard).join("");

    attachTiltTo(".featured-card.tilt");

    // click + keyboard
    const openById = (id) => {
      const item = portfolioData.find((x) => x.id === id);
      if (!item) return;
      if (item.type === "drive_folder") openProjectFolderModal(item);
      else openModal(item);
    };

    track.addEventListener("click", (e) => {
      const card = e.target.closest(".featured-card");
      if (!card) return;
      openById(card.dataset.id);
    });

    track.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".featured-card");
      if (!card) return;
      e.preventDefault();
      openById(card.dataset.id);
    });

    // auto scroll
    // Auto slide (scrollLeft) kanan -> kiri
    let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();

    // ✅ Speed berbeda untuk mobile vs desktop
    const mqMobile = window.matchMedia("(max-width: 560px)");
    let speed = mqMobile.matches ? 0.14 : 0.28; // mobile lebih pelan

    // kalau orientation/resize berubah, speed ikut update
    const syncSpeed = () => (speed = mqMobile.matches ? 0.14 : 0.28);
    mqMobile.addEventListener?.("change", syncSpeed);
    window.addEventListener("resize", syncSpeed);

     const tick = (now) => {
      let dt = now - last;
      last = now;

      // ✅ cegah loncatan besar saat resume tab
      dt = Math.min(dt, 32);

      if (!paused) {
        marquee.scrollLeft += dt * speed;

        const half = track.scrollWidth / 2;
        if (marquee.scrollLeft >= half) marquee.scrollLeft = 0;
      }

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        requestAnimationFrame(tick);
      }
    };


    marquee.addEventListener("mouseenter", () => (paused = true));
    marquee.addEventListener("mouseleave", () => (paused = false));
    marquee.addEventListener("touchstart", () => (paused = true), { passive: true });
    marquee.addEventListener("touchend", () => (paused = false), { passive: true });

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(tick);
    }
    return;
  }

  // ===== slider transform (kalau HTML kamu pakai viewport + dots + prev/next)
  if (viewport) {
    track.innerHTML = baseItems.map(buildFeaturedCard).join("");
    attachTiltTo(".featured-card.tilt");

    let idx = 0;
    let timer = null;
    const AUTOPLAY_MS = 6500;

    function slideWidth() {
      const first = track.querySelector(".featured-card");
      if (!first) return 340;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "18") || 18;
      return first.getBoundingClientRect().width + gap;
    }

    function renderDots() {
      if (!dots) return;
      dots.innerHTML = baseItems
        .map(
          (_, i) =>
            `<button type="button" class="${i === 0 ? "is-active" : ""}" aria-label="Go to slide ${
              i + 1
            }" data-idx="${i}"></button>`
        )
        .join("");
    }

    function updateDots() {
      if (!dots) return;
      Array.from(dots.querySelectorAll("button")).forEach((b, i) =>
        b.classList.toggle("is-active", i === idx)
      );
    }

    function applyTransform(smooth = true) {
      track.style.transition = smooth ? "transform 700ms ease" : "none";
      track.style.transform = `translateX(${-idx * slideWidth()}px)`;
      updateDots();
    }

    function goNext() {
      idx = (idx + 1) % baseItems.length;
      applyTransform(true);
    }
    function goPrev() {
      idx = (idx - 1 + baseItems.length) % baseItems.length;
      applyTransform(true);
    }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(goNext, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    // events
    const openById = (id) => {
      const item = portfolioData.find((x) => x.id === id);
      if (!item) return;
      if (item.type === "drive_folder") openProjectFolderModal(item);
      else openModal(item);
    };

    track.addEventListener("click", (e) => {
      const card = e.target.closest(".featured-card");
      if (!card) return;
      openById(card.dataset.id);
    });

    track.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const card = e.target.closest(".featured-card");
      if (!card) return;
      openById(card.dataset.id);
    });

    if (nextBtn) nextBtn.addEventListener("click", () => { goNext(); startAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", () => { goPrev(); startAutoplay(); });

    if (dots) {
      dots.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-idx]");
        if (!btn) return;
        idx = Number(btn.dataset.idx) || 0;
        applyTransform(true);
        startAutoplay();
      });
    }

    viewport.addEventListener("mouseenter", stopAutoplay);
    viewport.addEventListener("mouseleave", startAutoplay);

    window.addEventListener("resize", () => applyTransform(false));

    renderDots();
    applyTransform(false);
    startAutoplay();
  }
}

/* =========================================================
   REVEAL ON SCROLL
========================================================= */
function initRevealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-in");
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach((el) => io.observe(el));
}

/* =========================================================
   CONTACT FORM (Formspree fetch) - single handler
========================================================= */
function initContactForm() {
  const form =
    document.getElementById("contactForm") ||
    document.querySelector(".contact-form");
  if (!form) return;

  const statusEl =
    form.querySelector(".form-status") || document.getElementById("formNote");
  const btn = form.querySelector(".btn-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      if (statusEl) statusEl.textContent = "Mohon isi semua kolom dengan benar.";
      return;
    }

    if (btn) btn.disabled = true;
    if (statusEl) statusEl.textContent = "Mengirim pesan...";

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        if (statusEl) statusEl.textContent = "✅ Pesan terkirim. Terima kasih!";
        form.reset();
      } else {
        if (statusEl) statusEl.textContent = "❌ Gagal mengirim. Coba lagi ya.";
      }
    } catch {
      if (statusEl) statusEl.textContent = "❌ Error koneksi. Cek internet kamu.";
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

/* =========================================================
   INIT (DOM Ready)
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  // base interactions
  initRevealOnScroll();
  attachTiltTo(".tilt");
  attachMagneticTo(".magnetic");

  // contact form
  initContactForm();

  // Load data from Supabase (or cache)
  await loadPortfolioData();

  // rebuild categories after data is loaded
  rebuildCategories();

  // render UI
  renderFilters();
  renderGrid();

  // featured
  initFeatured();

  // Hide loader
  const loader = document.getElementById('siteLoader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 500);
  }

  /* EVENTS: filters, search, grid click */
  if (filtersWrap) {
    filtersWrap.addEventListener("click", (e) => {
      const openBtn = e.target.closest(".category-open-btn");
      if (openBtn) {
        openCategoryModal(openBtn.dataset.openCat || "");
        return;
      }
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const nextCategory = btn.dataset.cat || "";
      if (nextCategory && nextCategory === activeCategory) {
        openCategoryModal(nextCategory);
        return;
      }
      activeCategory = nextCategory;
      renderFilters();
      renderGrid();
    });
  }

  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value || "";
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderGrid(), 250);
    });
  }

  if (grid) {
    const openGridCard = (card) => {
      if (!card) return;
      const id = card.dataset.id;
      const item = portfolioData.find((x) => x.id === id);
      if (!item) return;
      if (item.type === "drive_folder") openProjectFolderModal(item);
      else openModal(item);
    };

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".work-item");
      openGridCard(card);
    });

    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".work-item");
      if (!card) return;
      e.preventDefault();
      openGridCard(card);
    });
  }

  // modal close buttons
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);

  // category modal close buttons
  if (catBackdrop) catBackdrop.addEventListener("click", closeCategoryModal);
  if (catClose) catClose.addEventListener("click", closeCategoryModal);

  // category prev/next
  if (catPrev) {
    catPrev.addEventListener("click", () => {
      if (!catItems.length) return;
      activeIndex = Math.max(0, activeIndex - 1);
      updateCatUI();
      snapTo(activeIndex);
    });
  }
  if (catNext) {
    catNext.addEventListener("click", () => {
      if (!catItems.length) return;
      activeIndex = Math.min(catItems.length - 1, activeIndex + 1);
      updateCatUI();
      snapTo(activeIndex);
    });
  }

  // detect active slide while scrolling
  let scrollTimer;
  if (catTrack) {
    catTrack.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const slides = Array.from(catTrack.querySelectorAll(".slide"));
        if (!slides.length) return;

        // Gunakan getBoundingClientRect() untuk akurasi posisi relatif terhadap viewport
        const trackRect = catTrack.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        let best = 0;
        let bestDist = Infinity;

        slides.forEach((s) => {
          const rect = s.getBoundingClientRect();
          const sCenter = rect.left + rect.width / 2;
          const dist = Math.abs(sCenter - trackCenter);
          if (dist < bestDist) {
            bestDist = dist;
            best = Number(s.dataset.idx);
          }
        });

        activeIndex = best;
        updateCatUI();
      }, 80);
    });

    // drag to scroll
    let isDown = false;
    let startX = 0;
    let startLeft = 0;

    catTrack.addEventListener("mousedown", (e) => {
      isDown = true;
      catTrack.style.scrollBehavior = "auto"; // Hindari lag saat menggeser
      startX = e.pageX;
      startLeft = catTrack.scrollLeft;
    });
    
    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      catTrack.style.scrollBehavior = "smooth"; // Kembalikan efek smooth scroll setelah selesai menggeser
    };
    window.addEventListener("mouseup", stopDrag);
    catTrack.addEventListener("mouseleave", stopDrag);
    
    catTrack.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - startX;
      catTrack.scrollLeft = startLeft - dx;
    });
  }
});

/* =========================================================
   GLOBAL: Escape closes whichever modal is open
========================================================= */
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // Tutup modal paling atas dulu (catModal z-index 80 > modal z-index 50)
  if (catModal && catModal.classList.contains("is-open")) {
    closeCategoryModal();
    return;
  }
  if (modal && modal.classList.contains("is-open")) {
    closeModal();
    return;
  }
});

/* (removed: onbeforeunload form reset — menghapus draft user tanpa alasan) */
/* =========================
   Footer year auto update
========================= */
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
