import { checkAdmin } from '../api.js';
import { supabaseClient } from '../supabase-config.js';

const getClient = () => supabaseClient;

export function showApp() {
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  if (loginScreen) loginScreen.style.display = 'none';
  if (adminApp) adminApp.style.display = 'block';
}

export function showLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  if (loginScreen) loginScreen.style.display = 'flex';
  if (adminApp) adminApp.style.display = 'none';
}

export async function enterAdmin(onSuccess) {
  const allowed = await checkAdmin();
  if (!allowed) {
    const client = getClient();
    if (client) await client.auth.signOut();
    showLogin();
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = 'Akun ini tidak memiliki akses admin.';
    return;
  }
  showApp();
  if (onSuccess) await onSuccess();
}

export async function initAuth(onSuccessInit) {
  const client = getClient();
  if (!client) {
    showLogin();
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = 'Supabase SDK tidak termuat.';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  // Check session on load
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    try {
      await enterAdmin(onSuccessInit);
    } catch (err) {
      showLogin();
      if (loginError) loginError.textContent = err.message || 'Gagal memverifikasi akses admin.';
    }
  } else {
    showLogin();
  }

  // Login
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    const { error } = await client.auth.signInWithPassword({ email, password: pass });

    if (error) {
      if (loginError) loginError.textContent = error.message || 'Login gagal.';
      return;
    }

    try {
      await enterAdmin(onSuccessInit);
    } catch (err) {
      await client.auth.signOut();
      showLogin();
      if (loginError) loginError.textContent = err.message || 'Gagal memverifikasi akses admin.';
    }
  });

  // Logout
  logoutBtn?.addEventListener('click', async () => {
    await client.auth.signOut();
    showLogin();
  });
}
