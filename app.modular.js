import { $, dateNow } from './js/core.js';
import { closeMenus, openTab } from './js/ui.js';
import { applyTheme, getTheme, getColorTheme } from './js/theme.js';
import { applyIcons, initIconFields } from './js/icons.js';
import { initNavigation } from './js/navigation.js';
import { loadProfileIntoForm } from './js/profile.js';
import { initMenuEvents } from './js/events.js';
import { loadSettings } from './js/settings.js';

const initModularApp = async () => {
  applyTheme(document.documentElement, getTheme(), getColorTheme());
  initIconFields();
  applyIcons();
  loadProfileIntoForm();

  initNavigation({
    closeMenus,
    onTabChange: tab => {
      if (tab === 'dashboard') window.loadDashboard?.();
      if (tab === 'calendrier') window.renderCalendar?.();
    }
  });

  initMenuEvents({
    onSidebarToggle: () => {
      const layout = document.querySelector('.layout');
      if (window.innerWidth <= 780) layout?.classList.toggle('mobile-menu');
    }
  });

  const date = $('fa-date');
  if (date && !date.value) date.value = dateNow();

  if (window.supabase && typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    try {
      window.appSettings = await loadSettings(db);
    } catch (error) {
      console.error('Erreur de chargement des réglages Supabase', error);
    }
  } else {
    console.warn('Configuration Supabase absente dans la version expérimentale.');
  }
};

document.addEventListener('DOMContentLoaded', initModularApp);
