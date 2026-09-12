import { $, dateNow } from './js/core.js';
import { closeMenus, openTab } from './js/ui.js';
import { applyTheme, getTheme, getColorTheme } from './js/theme.js';
import { applyIcons, initIconFields } from './js/icons.js';
import { initNavigation } from './js/navigation.js';
import { loadProfileIntoForm } from './js/profile.js';
import { initMenuEvents } from './js/events.js';

const initModularApp = () => {
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
};

document.addEventListener('DOMContentLoaded', initModularApp);
