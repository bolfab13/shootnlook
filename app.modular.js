import { $, dateNow } from './js/core.js';
import { closeMenus } from './js/ui.js';
import { applyTheme, getTheme, getColorTheme } from './js/theme.js';
import { applyIcons, initIconFields } from './js/icons.js';
import { initNavigation } from './js/navigation.js';
import { loadProfileIntoForm } from './js/profile.js';
import { initMenuEvents } from './js/events.js';
import { loadSettings } from './js/settings.js';

let initialized = false;

const setSupabaseStatus = (status, message = '') => {
  window.supabaseStatus = status;
  const element = document.getElementById('about-supabase-status');
  if (element) {
    element.textContent = message || ({ connected: 'Connecté', error: 'Erreur de connexion', unconfigured: 'Non configuré' }[status] || status);
    element.dataset.status = status;
  }
};

const toggleSidebar = () => {
  const root = document.documentElement;
  const layout = document.querySelector('.layout');
  if (!layout) return;
  if (window.innerWidth <= 780) {
    layout.classList.toggle('mobile-menu');
    return;
  }
  const next = root.dataset.sidebar === 'compact' ? 'normal' : 'compact';
  root.dataset.sidebar = next;
  localStorage.setItem('sidebar', next);
};

const initModularApp = async () => {
  if (initialized) return;
  initialized = true;

  applyTheme(document.documentElement, getTheme(), getColorTheme());
  initIconFields();
  applyIcons();
  loadProfileIntoForm();
  initNavigation({ closeMenus });

  const sidebar = document.getElementById('sidebar-toggle');
  if (sidebar) {
    sidebar.onclick = toggleSidebar;
  }

  const originalMenuInit = document.querySelectorAll('.topbar-menu-wrap');
  initMenuEvents();

  const date = $('fa-date');
  if (date && !date.value) date.value = dateNow();

  if (!window.supabase || typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
    setSupabaseStatus('unconfigured', 'Non configuré');
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    window.appSettings = await loadSettings(db);
    setSupabaseStatus('connected', 'Connecté');
  } catch (error) {
    console.error('Erreur de chargement des réglages Supabase', error);
    setSupabaseStatus('error', 'Erreur de connexion');
  }
};

document.addEventListener('DOMContentLoaded', initModularApp, { once: true });
