import { $, dateNow, safe, euro } from './js/core.js';
import { closeMenus, openTab } from './js/ui.js';
import { applyTheme, getTheme, getColorTheme } from './js/theme.js';
import { applyIcons, initIconFields } from './js/icons.js';
import { initNavigation, initSidebarToggle } from './js/navigation.js';
import { loadProfileIntoForm } from './js/profile.js';
import { initMenuEvents } from './js/events.js';
import { loadSettings } from './js/settings.js';
import { createPrestationsModule } from './js/prestations.js';
import { APP_VERSION, APP_BUILD } from './js/versioned-loader.js';

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

const closeMobileSidebar = () => {
  if (window.innerWidth <= 780) {
    document.querySelector('.layout')?.classList.remove('mobile-menu');
  }
};

const initModularApp = async () => {
  if (initialized) return;
  initialized = true;

  window.APP_VERSION = APP_VERSION;
  window.APP_BUILD = APP_BUILD;

  applyTheme(document.documentElement, getTheme(), getColorTheme());
  initIconFields();
  applyIcons();
  loadProfileIntoForm();
  initSidebarToggle();
  initNavigation({ closeMenus });

  const sidebar = document.getElementById('sidebar-toggle');
  if (sidebar) sidebar.onclick = toggleSidebar;

  document.querySelectorAll('#tabs button[data-tab]').forEach(button => {
    button.addEventListener('click', closeMobileSidebar, { passive: true });
  });

  initMenuEvents({ onSidebarToggle: toggleSidebar });

  const date = $('fa-date');
  if (date && !date.value) date.value = dateNow();

  const aboutButton = document.getElementById('about-btn');
  aboutButton?.addEventListener('click', () => {
    document.getElementById('about-modal')?.classList.add('visible');
    closeMenus();
  });

  document.getElementById('close-about')?.addEventListener('click', () => {
    document.getElementById('about-modal')?.classList.remove('visible');
  });

  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    document.getElementById('profile-modal')?.classList.add('visible');
    closeMenus();
  });

  document.getElementById('fermer-profil')?.addEventListener('click', () => {
    document.getElementById('profile-modal')?.classList.remove('visible');
  });

  const supabaseUrl = window.SUPABASE_URL || window.supabase?.supabaseUrl;
  const supabaseAnonKey = window.SUPABASE_ANON_KEY || window.supabase?.supabaseKey;

  if (!window.supabase || !supabaseUrl || !supabaseAnonKey) {
    setSupabaseStatus('unconfigured', 'Non configuré');
    return;
  }

  const db = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  try {
    window.appSettings = await loadSettings(db);
    setSupabaseStatus('connected', 'Connecté');

    const prestationsModule = createPrestationsModule({
      db,
      $,
      state: { services: [], currentService: null },
      safe,
      euro,
      openTab
    });

    window.appModules = window.appModules || {};
    window.appModules.prestations = prestationsModule;

    prestationsModule.bindForm();
    await prestationsModule.loadServices();
  } catch (error) {
    console.error('Erreur de chargement des réglages Supabase', error);
    setSupabaseStatus('error', 'Erreur de connexion');
  }
};

document.addEventListener('DOMContentLoaded', initModularApp, { once: true });
