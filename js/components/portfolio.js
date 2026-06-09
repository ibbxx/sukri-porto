import { escapeAttr, escapeHtml } from '../utils.js';
import { openModal, openProjectFolderModal, openCategoryModal } from './modal.js';

let portfolioData = [];
let categories = [];
let activeCategory = "";
let searchQuery = "";

export function setPortfolioData(data) {
  portfolioData = data;
  rebuildCategories();
}

function rebuildCategories() {
  categories = Array.from(new Set(portfolioData.map((x) => x.category)));
  activeCategory = "";
}

function attachTiltTo(selector) {
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

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
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
  });
}

function shouldShowThumb(item) {
  if (!item.thumbnailUrl) return false;
  if (String(item.thumbnailUrl).includes('via.placeholder.com')) return false;
  return true;
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

export function renderFilters() {
  const filtersWrap = document.getElementById("filters");
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
      </div>
    `
    )
    .join("");
}

export function renderGrid() {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  const items = portfolioData.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const catOk = !activeCategory ? true : item.category === activeCategory;
    const qOk =
      !q ||
      (
        (item.title || "") + " " + (item.description || "") + " " + (item.tags || []).join(" ")
      ).toLowerCase().includes(q);
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
            ${(item.tags || []).slice(0, 3).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
      </article>
    `
    )
    .join("");

  attachTiltTo(".work-item.tilt");
}

export function initPortfolio() {
  const filtersWrap = document.getElementById("filters");
  const searchInput = document.getElementById("searchInput");
  const grid = document.getElementById("portfolioGrid");

  if (filtersWrap) {
    filtersWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const nextCategory = btn.dataset.cat || "";
      if (nextCategory && nextCategory === activeCategory) {
        openCategoryModal(nextCategory, portfolioData);
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
}

// Helper to expose attachTiltTo for featured.js
export { attachTiltTo };
