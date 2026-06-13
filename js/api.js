/* =========================================================
   API LAYER (Supabase)
========================================================= */

// Kita asumsikan supabaseClient sudah tersedia di window, karena di-load via script tag.
import { supabaseClient } from './supabase-config.js';
import { getDriveEmbedUrl } from './utils.js';

const getClient = () => supabaseClient;

export const CACHE_KEY_PORTFOLIO = 'portfolio_cache';
export const CACHE_KEY_SUBS = 'portfolio_subs_cache';
export const CACHE_KEY_SITE = 'site_content_cache';

export async function fetchAllData() {
  const client = getClient();
  if (!client) throw new Error('Supabase SDK tidak termuat atau tidak terinisialisasi.');

  const [itemsRes, subsRes, siteRes] = await Promise.all([
    client.from('portfolio_items').select('*').order('sort_order', { ascending: true }),
    client.from('portfolio_sub_items').select('*').order('sort_order', { ascending: true }),
    client.from('site_content').select('*')
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (subsRes.error) throw subsRes.error;
  if (siteRes.error) throw siteRes.error;

  const items = itemsRes.data || [];
  const subs = subsRes.data || [];
  const siteRows = siteRes.data || [];

  // Cache
  try {
    localStorage.setItem(CACHE_KEY_PORTFOLIO, JSON.stringify(items));
    localStorage.setItem(CACHE_KEY_SUBS, JSON.stringify(subs));
    localStorage.setItem(CACHE_KEY_SITE, JSON.stringify(siteRows));
  } catch (cacheErr) {
    console.warn('Gagal menyimpan cache ke localStorage:', cacheErr);
  }

  return { items, subs, siteRows };
}

export function fetchFromCache() {
  try {
    const items = JSON.parse(localStorage.getItem(CACHE_KEY_PORTFOLIO) || '[]');
    const subs = JSON.parse(localStorage.getItem(CACHE_KEY_SUBS) || '[]');
    const siteRows = JSON.parse(localStorage.getItem(CACHE_KEY_SITE) || '[]');
    return { items, subs, siteRows };
  } catch {
    return { items: [], subs: [], siteRows: [] };
  }
}

// === ADMIN SPECIFIC ===

export async function checkAdmin() {
  const client = getClient();
  if (!client) return false;
  const { data, error } = await client.rpc('is_portfolio_admin');
  if (error) throw error;
  return data === true;
}

export async function uploadFile(file, folder) {
  const client = getClient();
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;

  const { data, error } = await client.storage
    .from('media')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = client.storage
    .from('media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export function mediaPathFromUrl(url) {
  const client = getClient();
  if (!client) return '';
  // Ambil instance client URL
  const supabaseUrlObj = new URL(client.supabaseUrl);
  const marker = '/storage/v1/object/public/media/';
  try {
    const parsed = new URL(String(url || ''));
    if (parsed.host !== supabaseUrlObj.host || !parsed.pathname.startsWith(marker)) return '';
    return decodeURIComponent(parsed.pathname.slice(marker.length));
  } catch {
    return '';
  }
}

export async function removeMediaUrls(urls) {
  const client = getClient();
  const paths = [...new Set((urls || []).map(mediaPathFromUrl).filter(Boolean))];
  if (!paths.length) return;
  const { error } = await client.storage.from('media').remove(paths);
  if (error) throw error;
}

export async function upsertPortfolioItem(row) {
  const { error } = await getClient()
    .from('portfolio_items')
    .upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deletePortfolioItem(id) {
  const { error } = await getClient()
    .from('portfolio_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function replaceSubItems(parentId, type, editingSubItems, allSubs) {
  const client = getClient();
  const oldIds = allSubs.filter(s => s.parent_id === parentId).map(s => s.id);

  // 1. Delete data lama terlebih dahulu
  if (oldIds.length) {
    const { error: deleteError } = await client.from('portfolio_sub_items').delete().in('id', oldIds);
    if (deleteError) throw deleteError;
  }

  // 2. Insert data baru
  if (type === 'drive_folder' && editingSubItems.length) {
    const subRows = editingSubItems.map((s, i) => {
      let embedUrl = s.embed_url || '';
      if ((s.type === 'drive_video' || s.type === 'drive_image') && s.source_url) {
        embedUrl = getDriveEmbedUrl(s.source_url);
      }
      return {
        parent_id: parentId,
        title: s.title || `Item ${i + 1}`,
        type: s.type || 'drive_video',
        source_url: s.source_url || '',
        embed_url: embedUrl,
        folder_url: s.folder_url || s.source_url || '',
        sort_order: i,
      };
    });

    const { error: insertError } = await client
      .from('portfolio_sub_items')
      .insert(subRows);
    if (insertError) throw insertError;
  }
}

export async function upsertSiteContent(key, value) {
  const { error } = await getClient()
    .from('site_content')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}
