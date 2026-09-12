const profileKeys = {
  pseudo: 'profil_pseudo',
  societe: 'profil_societe',
  adresse: 'profil_adresse',
  codePostal: 'profil_code_postal',
  ville: 'profil_ville'
};

export const getProfile = () => Object.fromEntries(
  Object.entries(profileKeys).map(([name, key]) => [name, localStorage.getItem(key) || ''])
);

export const saveProfile = (profile = {}) => {
  const next = { ...getProfile(), ...profile };
  Object.entries(profileKeys).forEach(([name, key]) => {
    localStorage.setItem(key, next[name] || '');
  });
  return next;
};

export const loadProfileIntoForm = (get = id => document.getElementById(id)) => {
  const profile = getProfile();
  const fields = {
    'pf-pseudo': profile.pseudo || 'Admin',
    'pf-societe': profile.societe,
    'pf-adresse': profile.adresse,
    'pf-code-postal': profile.codePostal,
    'pf-ville': profile.ville
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = get(id);
    if (field) field.value = value;
  });

  const pseudo = profile.pseudo || 'Admin';
  ['topbar-user-name', 'menu-user-name', 'dashboard-user-name'].forEach(id => {
    const element = get(id);
    if (element) element.textContent = pseudo;
  });

  document.querySelectorAll('.user-avatar')
    .forEach(element => { element.textContent = pseudo[0]?.toUpperCase() || 'A'; });

  return profile;
};
