export const defaultIcons = {
  dashboard: 'bx bx-home-circle',
  calendrier: 'bx bx-calendar',
  ecuries: 'bx bx-buildings',
  cavaliers: 'bx bx-group',
  shootings: 'bx bx-camera-movie',
  prestations: 'bx bx-camera',
  facturation: 'bx bx-receipt',
  factures: 'bx bx-file',
  reglages: 'bx bx-cog'
};

export const getIcons = () => {
  try {
    return JSON.parse(localStorage.getItem('boxicons_menu') || '{}');
  } catch {
    return {};
  }
};

export const saveIcon = (name, value) => {
  const icons = getIcons();
  icons[name] = value?.trim() || defaultIcons[name];
  localStorage.setItem('boxicons_menu', JSON.stringify(icons));
  return icons;
};

export const applyIcons = (icons = getIcons()) => {
  document.querySelectorAll('#tabs button[data-tab]').forEach(button => {
    const icon = button.querySelector('.icon');
    if (!icon) return;
    icon.className = `icon ${icons[button.dataset.tab] || defaultIcons[button.dataset.tab]}`;
    icon.textContent = '';
  });

  document.querySelectorAll('[data-preview-icon]').forEach(icon => {
    const name = icon.dataset.previewIcon;
    icon.className = icons[name] || defaultIcons[name];
  });
};

export const initIconFields = () => {
  const icons = getIcons();
  document.querySelectorAll('[data-menu-icon]').forEach(input => {
    const name = input.dataset.menuIcon;
    input.value = icons[name] || defaultIcons[name];
    input.addEventListener('input', () => applyIcons(saveIcon(name, input.value)));
  });
};
