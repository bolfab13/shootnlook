const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const profileModal = $('profile-modal');
const profileForm = $('form-profil');
const pseudoInput = $('pf-pseudo');
const companyInput = $('pf-societe');
const addressInput = $('pf-adresse');
const zipInput = $('pf-code-postal');
const cityInput = $('pf-ville');

function closeProfileModal() {
  profileModal?.classList.remove('visible');
}

function openProfileModal() {
  profileModal?.classList.add('visible');
}

function loadLocalProfile() {
  const pseudo = localStorage.getItem('profil_pseudo') || 'Admin';
  const company = localStorage.getItem('profil_societe') || '';
  const address = localStorage.getItem('profil_adresse') || '';
  const zip = localStorage.getItem('profil_code_postal') || '';
  const city = localStorage.getItem('profil_ville') || '';

  if (pseudoInput) pseudoInput.value = pseudo;
  if (companyInput) companyInput.value = company;
  if (addressInput) addressInput.value = address;
  if (zipInput) zipInput.value = zip;
  if (cityInput) cityInput.value = city;

  ['topbar-user-name', 'menu-user-name', 'dashboard-user-name'].forEach((id) => {
    const element = $(id);
    if (element) element.textContent = pseudo;
  });

  document.querySelectorAll('.user-avatar').forEach((avatar) => {
    avatar.textContent = pseudo.charAt(0).toUpperCase() || 'A';
  });
}

async function saveProfile(event) {
  event.preventDefault();

  const pseudo = pseudoInput?.value.trim() || 'Admin';
  const company = companyInput?.value.trim() || '';
  const address = addressInput?.value.trim() || '';
  const zip = zipInput?.value.trim() || '';
  const city = cityInput?.value.trim() || '';

  localStorage.setItem('profil_pseudo', pseudo);
  localStorage.setItem('profil_societe', company);
  localStorage.setItem('profil_adresse', address);
  localStorage.setItem('profil_code_postal', zip);
  localStorage.setItem('profil_ville', city);

  loadLocalProfile();
  closeProfileModal();
}

document.addEventListener('DOMContentLoaded', () => {
  closeProfileModal();
  loadLocalProfile();

  $('edit-profile-btn')?.addEventListener('click', () => {
    openProfileModal();
  });

  $('fermer-profil')?.addEventListener('click', closeProfileModal);

  profileModal?.addEventListener('click', (event) => {
    if (event.target === profileModal) closeProfileModal();
  });

  profileForm?.addEventListener('submit', saveProfile);
});
