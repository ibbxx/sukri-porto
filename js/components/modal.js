import { escapeAttr, escapeHtml } from '../utils.js';

let openModalCount = 0;
let isProgrammaticScroll = false;

/* =========================================================
   SINGLE ITEM MODAL
========================================================= */
export function openModal(item) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  const modalOpenLink = document.getElementById("modalOpenLink");

  if (!modal || !modalBody) return;

  if (modalTitle) modalTitle.textContent = item.title || "";
  if (modalCategory) modalCategory.textContent = item.category || "";
  if (modalOpenLink) modalOpenLink.href = item.sourceUrl || item.embedUrl || "#";

  // Render tags
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

  modal.classList.remove("modal--ig");
  modalBody.classList.remove("modal-body--ig");

  if (item.type === "youtube" && item.embedUrl) {
    modalBody.innerHTML = `<iframe src="${escapeAttr(item.embedUrl)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if ((item.type === "drive_video" || item.type === "drive_image") && item.embedUrl) {
    modalBody.innerHTML = `<iframe src="${escapeAttr(item.embedUrl)}" loading="lazy" allow="autoplay" allowfullscreen></iframe>`;
  } else if ((item.type === "instagram_embed" || item.type === "link") && item.sourceUrl && String(item.sourceUrl).includes("instagram.com/")) {
    modal.classList.add("modal--ig");
    modalBody.classList.add("modal-body--ig");
    modalBody.style.overflow = "auto";
    modalBody.style.webkitOverflowScrolling = "touch";

    modalBody.innerHTML = `
      <div class="ig-embed-wrap" style="padding:12px;">
        <blockquote class="instagram-media" data-instgrm-permalink="${escapeAttr(item.sourceUrl)}" data-instgrm-version="14" style="margin:0; width:100%; max-width:100%;"></blockquote>
      </div>
    `;
    const processIg = () => { if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process(); };
    setTimeout(() => { processIg(); setTimeout(processIg, 350); }, 50);
  } else if (item.thumbnailUrl) {
    modalBody.innerHTML = `
      <div class="modal-image-wrap" style="display:flex; justify-content:center; align-items:center; height:100%; min-height:65vh; overflow:hidden;">
        <img src="${escapeAttr(item.thumbnailUrl)}" alt="${escapeAttr(item.title)}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px;" />
      </div>
    `;
  } else {
    modalBody.innerHTML = `<div class="modal-placeholder">Preview tidak tersedia untuk tipe ini. Klik tombol "Open Source Link".</div>`;
  }

  if (!modal.classList.contains("is-open")) openModalCount++;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeModal() {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");
  
  if (!modal || !modal.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

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
   CATEGORY / FOLDER SLIDER MODAL
========================================================= */
let catItems = [];
let activeIndex = 0;
let catMediaBuilder = null;

function processInstagramEmbeds() {
  if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
}

function ensureSlideMedia(index) {
  const catTrack = document.getElementById("catTrack");
  if (!catTrack || !catItems[index]) return;
  const slot = catTrack.querySelector(`.slide[data-idx="${index}"] .slide-media-slot`);
  if (!slot || slot.dataset.hydrated === "1") return;
  slot.innerHTML = catMediaBuilder(catItems[index]);
  slot.dataset.hydrated = "1";
  // Delay IG embed processing to avoid race condition with DOM insertion
  setTimeout(() => { processInstagramEmbeds(); setTimeout(processInstagramEmbeds, 350); }, 50);
}

function updateCatUI() {
  const total = catItems.length || 1;
  const catCounter = document.getElementById("catCounter");
  const catOpenLink = document.getElementById("catOpenLink");
  if (catCounter) catCounter.textContent = `${activeIndex + 1} / ${total}`;
  const current = catItems[activeIndex];
  if (catOpenLink) catOpenLink.href = current?.folderUrl || current?.sourceUrl || current?.embedUrl || "#";
  ensureSlideMedia(activeIndex);
}

function snapTo(index, smooth = true) {
  const catTrack = document.getElementById("catTrack");
  if (!catTrack) return;
  const slide = catTrack.querySelector(`.slide[data-idx="${index}"]`);
  if (!slide) return;
  
  isProgrammaticScroll = true;
  slide.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    inline: "center",
    block: "nearest",
  });
  
  setTimeout(() => {
    isProgrammaticScroll = false;
  }, smooth ? 400 : 50);
}

function buildSlideMedia(item) {
  if (item.type === "youtube" && item.embedUrl) {
    return `<iframe class="slide-media" src="${escapeAttr(item.embedUrl)}" loading="lazy" allowfullscreen></iframe>`;
  }
  if ((item.type === "drive_video" || item.type === "drive_image") && item.embedUrl) {
    return `<iframe class="slide-media" src="${escapeAttr(item.embedUrl)}" loading="lazy" allow="autoplay" allowfullscreen></iframe>`;
  }
  if ((item.type === "instagram_embed" || item.type === "link") && item.sourceUrl && /instagram\.com\/(?:p|reel|tv)\//i.test(String(item.sourceUrl))) {
    return `
      <div class="slide-media" style="display:flex; justify-content:center; align-items:center; background:#fff; overflow:auto; padding:14px;">
        <blockquote class="instagram-media" data-instgrm-permalink="${escapeAttr(item.sourceUrl)}" data-instgrm-version="14"></blockquote>
      </div>
    `;
  }
  if (item.thumbnailUrl) {
    return `
      <div class="slide-media" style="display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.2); overflow:hidden;">
        <img src="${escapeAttr(item.thumbnailUrl)}" alt="${escapeAttr(item.title)}" style="max-width:100%; max-height:100%; object-fit:contain;" />
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

export function openCategoryModal(category, portfolioData) {
  const catModal = document.getElementById("catModal");
  const catTrack = document.getElementById("catTrack");
  const catTitleBadge = document.getElementById("catTitleBadge");
  const catTitle = document.getElementById("catTitle");

  if (!catModal || !catTrack) return;

  catItems = portfolioData.filter((x) => x.category === category);
  if (!catItems.length) return;
  
  catMediaBuilder = buildSlideMedia;
  activeIndex = 0;

  if (catTitleBadge) catTitleBadge.textContent = "Category";
  if (catTitle) catTitle.textContent = category;

  catTrack.innerHTML = catItems.map((item, idx) => `
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
  `).join("");

  if (!catModal.classList.contains("is-open")) openModalCount++;
  catModal.classList.add("is-open");
  catModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  processInstagramEmbeds();
  updateCatUI();
  snapTo(activeIndex, false);
}

export function closeCategoryModal() {
  const catModal = document.getElementById("catModal");
  const catTrack = document.getElementById("catTrack");

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
          <div style="font-weight:850; font-size:18px; margin-bottom:8px;">${escapeHtml(it.title)}</div>
          <div style="color: rgba(235,235,245,.65); font-size:13px; line-height:1.6;">Klik tombol di bawah untuk membuka dan melihat daftar file.</div>
          <div style="margin-top:14px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <a class="btn btn--ghost" href="${escapeAttr(it.folderUrl)}" target="_blank" rel="noopener">Buka Folder<span class="btn-glow"></span></a>
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
      <div style="margin-top:8px; color: rgba(235,235,245,.55); font-size:12px; line-height:1.6;">Klik "Open Selected Link" untuk membuka.</div>
      <div style="margin-top:12px;">
        <a class="btn btn--ghost" href="${escapeAttr(link)}" target="_blank" rel="noopener">Buka Link<span class="btn-glow"></span></a>
      </div>
    </div>
  `;
}

export function openProjectFolderModal(folder) {
  const catModal = document.getElementById("catModal");
  const catTrack = document.getElementById("catTrack");
  const catTitleBadge = document.getElementById("catTitleBadge");
  const catTitle = document.getElementById("catTitle");

  if (!catModal || !catTrack || !folder.items || !folder.items.length) {
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

  catTrack.innerHTML = catItems.map((it, idx) => `
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
  `).join("");

  if (!catModal.classList.contains("is-open")) openModalCount++;
  catModal.classList.add("is-open");
  catModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  updateCatUI();
  snapTo(activeIndex, false);
}

export function initModalEvents() {
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalCloseBtn = document.getElementById("modalClose");
  const catBackdrop = document.getElementById("catBackdrop");
  const catCloseBtn = document.getElementById("catClose");
  const catPrev = document.getElementById("catPrev");
  const catNext = document.getElementById("catNext");
  const catTrack = document.getElementById("catTrack");
  const catModal = document.getElementById("catModal");
  const modal = document.getElementById("modal");

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  if (modal) {
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) dialog.addEventListener("click", (e) => e.stopPropagation());
  }

  if (catBackdrop) {
    catBackdrop.addEventListener("click", closeCategoryModal);
  }
  if (catCloseBtn) catCloseBtn.addEventListener("click", closeCategoryModal);

  if (catModal) {
    const dialog = catModal.querySelector('.cat-dialog');
    if (dialog) dialog.addEventListener("click", (e) => e.stopPropagation());
  }

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

  // Scroll detection for active slide
  let scrollTimer;
  if (catTrack) {
    catTrack.addEventListener("scroll", () => {
      if (isProgrammaticScroll) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (isProgrammaticScroll) return;
        const slides = Array.from(catTrack.querySelectorAll(".slide"));
        if (!slides.length) return;

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

    // drag to scroll (only for non-touch to avoid interfering with native touch scrolling)
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (!isTouch) {
      let isDown = false;
      let startX = 0;
      let startLeft = 0;
      let wasDragging = false;

      catTrack.addEventListener("mousedown", (e) => {
        isDown = true;
        wasDragging = false;
        catTrack.style.scrollBehavior = "auto";
        startX = e.pageX;
        startLeft = catTrack.scrollLeft;
      });
      
      const stopDrag = () => {
        if (!isDown) return;
        isDown = false;
        catTrack.style.scrollBehavior = "smooth";
      };
      
      window.addEventListener("mouseup", stopDrag);
      catTrack.addEventListener("mouseleave", stopDrag);
      
      catTrack.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        if (Math.abs(dx) > 5) wasDragging = true;
        catTrack.scrollLeft = startLeft - dx;
      });

      // Prevent accidental clicks on links/buttons after drag-to-scroll
      catTrack.addEventListener("click", (e) => {
        if (wasDragging) {
          e.stopPropagation();
          e.preventDefault();
          wasDragging = false;
        }
      }, true);
    }
  }

  // Escape to close
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (catModal && catModal.classList.contains("is-open")) {
      closeCategoryModal();
      return;
    }
    if (modal && modal.classList.contains("is-open")) {
      closeModal();
      return;
    }
  });
}
