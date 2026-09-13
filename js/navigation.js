import { $ } from './core.js';

export function initNavigation({ onTabChange } = {}) {
  const layout = document.querySelector('.layout');
  const buttons = document.querySelectorAll('#tabs button[data-tab]');
  const titles = Object.fromEntries([...buttons].map(button => [button.dataset.tab, button.querySelector('.nav-label')?.textContent || '']));

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      $(button.dataset.tab)?.classList.add('active');
      const title = $('#page-title');
      if (title) title.textContent = titles[button.dataset.tab] || '';
      layout?.classList.remove('mobile-menu');
      onTabChange?.(button.dataset.tab);
    });
  });
}

export function initSidebarToggle() {
  const button = $('#sidebar-toggle');
  const layout = document.querySelector('.layout');
  if (!button || !layout || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (window.innerWidth <= 780) {
      layout.classList.toggle('mobile-menu');
    } else {
      const root = document.documentElement;
      const next = root.dataset.sidebar === 'compact' ? 'normal' : 'compact';
      root.dataset.sidebar = next;
      localStorage.setItem('sidebar', next);
    }
  });
}
