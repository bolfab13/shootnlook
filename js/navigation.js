export const pageTitles = {
  dashboard: 'Tableau de bord',
  calendrier: 'Calendrier',
  ecuries: 'Ecuries',
  cavaliers: 'Cavalier(e)s',
  shootings: 'Shootings',
  prestations: 'Grille tarifaire',
  facturation: 'Creer une facture',
  factures: 'Factures emises',
  reglages: 'Reglages'
};

export const openTab = (name, closeMenus = () => {}) => {
  document.querySelector(`#tabs button[data-tab="${name}"]`)?.click();
  closeMenus();
};

export const initNavigation = ({ onTabChange, closeMenus = () => {} } = {}) => {
  document.querySelectorAll('#tabs button[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#tabs button[data-tab]')
        .forEach(item => item.classList.toggle('active', item === button));
      document.querySelectorAll('.tab')
        .forEach(tab => tab.classList.toggle('active', tab.id === button.dataset.tab));
      const title = document.getElementById('page-title');
      if (title) title.textContent = pageTitles[button.dataset.tab] || '';
      closeMenus();
      onTabChange?.(button.dataset.tab);
    });
  });

  document.querySelectorAll('[data-open-tab]').forEach(button => {
    button.addEventListener('click', () => openTab(button.dataset.openTab, closeMenus));
  });
};
