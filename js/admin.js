import { fetchAllData } from './api.js';
import { initAuth } from './admin/auth.js';
import {
  initTabs,
  initViewToggle,
  initItemModalEvents,
  initDeleteModalEvents,
  initFilterAndSearch,
  renderItems,
  populateCategoryFilter,
  updateSiteContentUI,
  setupPhotoUploaders,
  setAdminData
} from './admin/admin-ui.js';

/* =========================================================
   CORE INITIALIZATION
========================================================= */

async function reloadData() {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Memuat data...';
  loadingIndicator.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg';
  document.body.appendChild(loadingIndicator);

  try {
    const { items, subs, siteRows } = await fetchAllData();
    setAdminData(items, subs, siteRows);
    
    populateCategoryFilter();
    renderItems(reloadData);
    updateSiteContentUI();
  } catch (err) {
    console.error("Gagal memuat data", err);
    alert('Gagal memuat data dari database. Silakan periksa koneksi Anda.');
  } finally {
    loadingIndicator.remove();
  }
}

async function onAdminAccessGranted() {
  // Setup UI behaviors
  initTabs();
  initViewToggle();
  initFilterAndSearch(reloadData);
  initItemModalEvents(reloadData);
  initDeleteModalEvents(reloadData);
  setupPhotoUploaders();

  // Load actual data
  await reloadData();
}

document.addEventListener('DOMContentLoaded', () => {
  // The SDK might take a split second to load. 
  // Normally supabase-config.js runs first.
  initAuth(onAdminAccessGranted);
});
