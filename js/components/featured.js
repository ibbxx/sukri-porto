import { escapeAttr, escapeHtml, guessIgThumb } from '../utils.js';
import { openModal, openProjectFolderModal } from './modal.js';
import { attachTiltTo } from './portfolio.js';

let FEATURED_IDS = [];
let FEATURED_THUMBS = {};
let portfolioData = [];

export function setFeaturedData(data, featuredIds, featuredThumbs) {
  portfolioData = data;
  FEATURED_IDS = featuredIds;
  FEATURED_THUMBS = featuredThumbs;
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
      if (FEATURED_THUMBS[cloned.id]) cloned.thumbnailUrl = FEATURED_THUMBS[cloned.id];
      const isIG = String(cloned.category || "").includes("(IG)") && cloned.sourceUrl && /instagram\.com\/(?:p|reel|tv)\//i.test(String(cloned.sourceUrl));
      const looksPlaceholder = !cloned.thumbnailUrl || String(cloned.thumbnailUrl).includes("via.placeholder.com");
      if (isIG && looksPlaceholder && !FEATURED_THUMBS[cloned.id]) {
        const g = guessIgThumb(cloned.sourceUrl);
        if (g) cloned.thumbnailUrl = g;
      }
      return cloned;
    });
}

function buildFeaturedCard(item) {
  const thumb = (item.thumbnailUrl || "").trim();
  return `
    <article class="featured-card tilt" data-id="${escapeAttr(item.id)}" role="button" tabindex="0"
      aria-label="Buka ${escapeAttr(item.title)}">
      <div class="featured-badge">${escapeHtml(item.category || "Featured")}</div>
      <div class="featured-media ${thumb ? "" : "is-empty"}">
        ${thumb ? `<img src="${escapeAttr(thumb)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove();this.parentElement.classList.add('is-empty')" />` : ""}
      </div>
      <div class="featured-overlay">
        <div class="featured-kicker">${escapeHtml(item.title)}</div>
        <div class="featured-line">${escapeHtml(featuredSecondLine(item))}</div>
      </div>
    </article>
  `;
}

export function initFeatured() {
  const track = document.getElementById("featuredTrack");
  if (!track) return;

  const marquee = document.getElementById("featuredMarquee");
  const viewport = document.getElementById("featuredViewport");
  const dots = document.getElementById("featuredDots");
  const prevBtn = document.querySelector(".f-prev");
  const nextBtn = document.querySelector(".f-next");

  const baseItems = getFeaturedItems();
  if (!baseItems.length) {
    track.innerHTML = `<div style="padding:12px; color:rgba(235,235,245,.7)">Featured list kosong.</div>`;
    return;
  }

  // Marquee handler
  if (marquee) {
    const loopItems = baseItems.concat(baseItems);
    track.innerHTML = loopItems.map(buildFeaturedCard).join("");
    attachTiltTo(".featured-card.tilt");

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

    let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isHovered = false;
    let paused = prefersReducedMotion;
    let last = performance.now();
    const mqMobile = window.matchMedia("(max-width: 560px)");
    let speed = mqMobile.matches ? 0.14 : 0.28;

    const syncSpeed = () => (speed = mqMobile.matches ? 0.14 : 0.28);
    mqMobile.addEventListener?.("change", syncSpeed);
    window.addEventListener("resize", syncSpeed);

    // Track changes to reduced-motion preference
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    mqMotion.addEventListener?.("change", (e) => {
      prefersReducedMotion = e.matches;
      paused = prefersReducedMotion || isHovered;
      if (!prefersReducedMotion) requestAnimationFrame(tick);
    });

    const tick = (now) => {
      let dt = now - last;
      last = now;
      dt = Math.min(dt, 32);

      if (!paused) {
        marquee.scrollLeft += dt * speed;
        const half = track.scrollWidth / 2;
        if (marquee.scrollLeft >= half) marquee.scrollLeft = 0;
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(tick);
      }
    };

    marquee.addEventListener("mouseenter", () => { isHovered = true; paused = true; });
    marquee.addEventListener("mouseleave", () => { isHovered = false; paused = prefersReducedMotion; });
    marquee.addEventListener("touchstart", () => { isHovered = true; paused = true; }, { passive: true });
    marquee.addEventListener("touchend", () => { isHovered = false; paused = prefersReducedMotion; }, { passive: true });

    if (!prefersReducedMotion) {
      requestAnimationFrame(tick);
    }
    return;
  }

  // Slider handler
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
      dots.innerHTML = baseItems.map((_, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" aria-label="Go to slide ${i + 1}" data-idx="${i}"></button>`).join("");
    }

    function updateDots() {
      if (!dots) return;
      Array.from(dots.querySelectorAll("button")).forEach((b, i) => b.classList.toggle("is-active", i === idx));
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
