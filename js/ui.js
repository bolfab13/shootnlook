export const getElement = id => document.getElementById(id);

export const closeMenus = (get = getElement) => {
  ['settings-menu', 'user-menu', 'bell-menu', 'unpaid-menu']
    .forEach(id => get(id)?.classList.remove('open'));
};

export const openTab = (name, get = getElement) => {
  document.querySelector(`#tabs button[data-tab="${name}"]`)?.click();
};

export const setText = (id, value, get = getElement) => {
  const element = get(id);
  if (element) element.textContent = value ?? '';
};
