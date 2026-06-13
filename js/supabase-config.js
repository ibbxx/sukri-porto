/* =========================================================
   SUPABASE CONFIG
   Ganti SUPABASE_URL dan SUPABASE_ANON_KEY sesuai project Anda.
   Buka: https://supabase.com → Project → Settings → API
========================================================= */

const SUPABASE_URL = 'https://fapggtuvdikpmhgwhfvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcGdndHV2ZGlrcG1oZ3doZnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODgzMDcsImV4cCI6MjA5NjI2NDMwN30.-Hrkyd89uhq4OoIA7IAoPUDHK0ACP5p672E4SDzP4mE';

// Inisialisasi Supabase client secara aman (SDK di-load via CDN di HTML)
export const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Expose ke global scope agar bisa diakses dari console (e.g. migrate-data.js)
if (supabaseClient) window.supabaseClient = supabaseClient;
