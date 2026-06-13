/* =========================================================
   UTILITIES
   Berisi fungsi helper umum untuk UI dan data parsing
========================================================= */

export { escapeHtml as esc };

export function escapeHtml(str) {
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

export function escapeAttr(str) {
  return escapeHtml(str);
}

export function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

export function getYoutubeId(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
}

export function getIgShortcode(url) {
  const m = String(url || "").match(/instagram\.com\/(?:p|reel|tv)\/([^\/\?\#]+)/i);
  return m ? m[1] : "";
}

export function guessIgThumb(url) {
  const code = getIgShortcode(url);
  return code ? `https://www.instagram.com/p/${code}/media/?size=l` : "";
}

export function generateId(category, title) {
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

export function toast(message, type = 'success') {
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

export function getDriveEmbedUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  // Matching file/d/[ID]
  const fileIdMatch = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  // Matching open?id=[ID] or open?id=[ID]&...
  const idQueryMatch = raw.match(/[\?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    return `https://drive.google.com/file/d/${idQueryMatch[1]}/preview`;
  }
  return '';
}

