import { safeUrl, getYoutubeId, guessIgThumb, getDriveEmbedUrl } from './utils.js';
import { fetchAllData, fetchFromCache } from './api.js';
import { initModalEvents } from './components/modal.js';
import { setPortfolioData, renderFilters, renderGrid, initPortfolio } from './components/portfolio.js';
import { setFeaturedData, initFeatured } from './components/featured.js';

/* =========================================================
   MOUSE GLOW (CSS vars)
========================================================= */
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

(() => {
  if (isTouchDevice()) return;
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
   REVEAL ON SCROLL
========================================================= */
function initRevealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-in");
    });
  }, { threshold: 0.15 });

  reveals.forEach((el) => io.observe(el));
}

/* =========================================================
   MAGNETIC EFFECT
========================================================= */
function attachMagneticTo(selector) {
  if (isTouchDevice()) return;
  
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
   DATA PROCESSING
========================================================= */
function buildPortfolioData(items, subs) {
  const subsMap = {};
  (subs || []).forEach(s => {
    if (!subsMap[s.parent_id]) subsMap[s.parent_id] = [];
    subsMap[s.parent_id].push(s);
  });

  const portfolioData = (items || []).map(row => {
    const sourceUrl = safeUrl(row.source_url);
    let embedUrl = safeUrl(row.embed_url);
    if (!embedUrl && row.type === 'youtube') {
      const ytId = getYoutubeId(sourceUrl);
      if (ytId) embedUrl = `https://www.youtube.com/embed/${ytId}`;
    }
    let thumb = safeUrl(row.thumbnail_url);
    if (!thumb && row.type === 'youtube') {
      const ytId = getYoutubeId(sourceUrl || embedUrl);
      if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    if ((!thumb || String(thumb).includes('via.placeholder.com')) && /instagram\.com\/(?:p|reel|tv)\//i.test(sourceUrl)) {
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

    if (row.type === 'drive_folder' && subsMap[row.id]) {
      item.items = subsMap[row.id].map(sub => {
        let embedUrl = safeUrl(sub.embed_url);
        if ((sub.type === 'drive_video' || sub.type === 'drive_image')) {
          embedUrl = getDriveEmbedUrl(embedUrl || sub.source_url);
        }
        return {
          title: sub.title,
          type: sub.type || 'drive_video',
          sourceUrl: safeUrl(sub.source_url),
          embedUrl: safeUrl(embedUrl),
          folderUrl: safeUrl(sub.folder_url),
        };
      });
    }

    return item;
  });

  const featuredIds = [];
  const featuredThumbs = {};
  (items || []).forEach(row => {
    if (row.is_featured) {
      featuredIds.push(row.id);
      if (row.featured_thumb) {
        featuredThumbs[row.id] = safeUrl(row.featured_thumb);
      }
    }
  });

  setPortfolioData(portfolioData);
  setFeaturedData(portfolioData, featuredIds, featuredThumbs);
}

function applySiteContent(rows) {
  if (!rows || !rows.length) return;
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });

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

async function loadData() {
  try {
    const { items, subs, siteRows } = await fetchAllData();
    buildPortfolioData(items, subs);
    applySiteContent(siteRows);
  } catch (err) {
    console.warn('⚠️ Supabase fetch gagal, memakai cache:', err.message || err);
    const { items, subs, siteRows } = fetchFromCache();
    buildPortfolioData(items, subs);
    applySiteContent(siteRows);
  }
}

/* =========================================================
   CONTACT FORM
========================================================= */
function initContactForm() {
  const form = document.getElementById("contactForm") || document.querySelector(".contact-form");
  if (!form) return;

  const statusEl = form.querySelector(".form-status") || document.getElementById("formNote");
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
  initRevealOnScroll();
  attachMagneticTo(".magnetic");
  initContactForm();

  await loadData();

  renderFilters();
  renderGrid();
  initPortfolio();
  initFeatured();
  initModalEvents();

  // Hide loader
  const loader = document.getElementById('siteLoader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 500);
  }

  // Footer year auto update
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Mobile Nav Hamburger Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    const toggleMenu = () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-open');
    };

    navToggle.addEventListener('click', toggleMenu);

    // Hide menu when link is clicked
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      });
    });

    // Hide menu when clicking outside
    document.addEventListener('click', (e) => {
      const navbar = document.querySelector('.navbar');
      if (navbar && !navbar.contains(e.target) && navMenu.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      }
    });
  }
});
