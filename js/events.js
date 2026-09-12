export const closeMenus = (get = id => document.getElementById(id)) => {
  ['settings-menu', 'user-menu', 'bell-menu', 'unpaid-menu']
    .forEach(id => get(id)?.classList.remove('open'));
};

export const initMenuEvents = ({ get = id => document.getElementById(id), onSidebarToggle } = {}) => {
  const menuButtons = [
    ['settings-toggle', 'settings-menu'],
    ['user-toggle', 'user-menu'],
    ['bell-toggle', 'bell-menu'],
    ['unpaid-toggle', 'unpaid-menu']
  ];

  menuButtons.forEach(([buttonId, menuId]) => {
    get(buttonId)?.addEventListener('click', event => {
      event.stopPropagation();
      closeMenus(get);
      get(menuId)?.classList.toggle('open');
    });
  });

  get('sidebar-toggle')?.addEventListener('click', () => onSidebarToggle?.());

  document.addEventListener('click', event => {
    if (!event.target.closest('.topbar-menu-wrap')) closeMenus(get);
  });
};
