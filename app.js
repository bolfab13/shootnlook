// app.js - Shoot'n'Look
// Gestion de l'authentification Supabase et du profil utilisateur

// On suppose que config.js expose :
// - const SUPABASE_URL
// - const SUPABASE_ANON_KEY
// et que Supabase est chargé via le script CDN dans index.html

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Élé··ments DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const profileOverlay = document.getElementById('profile-overlay');
const closeProfileBtn = document.getElementById('close-profile');
const saveProfileBtn = document.getElementById('save-profile');
const profileForm = document.getElementById('profile-form');
const profileMessage = document.getElementById('profile-message');

// Éé··tat
let currentUser = null;

// Utilitaires d'affichage de messages
function showProfileMessage(text, type = 'info') {
  if (!profileMessage) return;
  profileMessage.textContent = text;
  profileMessage.className = 'profile-message'; // reset
  if (type === 'success') {
    profileMessage.classList.add('success');
  } else if (type === 'error') {
    profileMessage.classList.add('error');
  }
  profileMessage.style.display = 'block';
}

function clearProfileMessage() {
  if (!profileMessage) return;
  profileMessage.textContent = '';
  profileMessage.style.display = 'none';
}

// Gestion de la modale de profil
function openProfileModal() {
  if (!profileModal) return;
  profileModal.style.display = 'flex';
  clearProfileMessage();
  loadProfile();
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.style.display = 'none';
  clearProfileMessage();
}

// Chargement du profil depuis Supabase
async function loadProfile() {
  if (!currentUser) {
    showProfileMessage('Aucun utilisateur connecté.', 'error');
    return;
  }

  if (!profileForm) return;

  // Déé··sactiver le bouton pendant le chargement
  if (saveProfileBtn) saveProfileBtn.disabled = true;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, phone, address, city, zip, country')
      .eq('id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = aucune ligne trouvéé··e
      showProfileMessage('Erreur lors du chargement du profil : ' + error.message, 'error');
      if (saveProfileBtn) saveProfileBtn.disabled = false;
      return;
    }

    // Remplir le formulaire si un profil existe
    if (data) {
      if (profileForm.username) profileForm.username.value = data.username || '';
      if (profileForm.full_name) profileForm.full_name.value = data.full_name || '';
      if (profileForm.email) profileForm.email.value = data.email || '';
      if (profileForm.phone) profileForm.phone.value = data.phone || '';
      if (profileForm.address) profileForm.address.value = data.address || '';
      if (profileForm.city) profileForm.city.value = data.city || '';
      if (profileForm.zip) profileForm.zip.value = data.zip || '';
      if (profileForm.country) profileForm.country.value = data.country || '';
    } else {
      // Aucun profil existant : on part de champs vides
      if (profileForm.username) profileForm.username.value = '';
      if (profileForm.full_name) profileForm.full_name.value = '';
      if (profileForm.email) profileForm.email.value = currentUser.email || '';
      if (profileForm.phone) profileForm.phone.value = '';
      if (profileForm.address) profileForm.address.value = '';
      if (profileForm.city) profileForm.city.value = '';
      if (profileForm.zip) profileForm.zip.value = '';
      if (profileForm.country) profileForm.country.value = '';
    }
  } catch (err) {
    showProfileMessage('Erreur inattendue lors du chargement du profil.', 'error');
    console.error(err);
  } finally {
    if (saveProfileBtn) saveProfileBtn.disabled = false;
  }
}

// Enregistrement du profil (upsert)
async function saveProfile() {
  if (!currentUser) {
    showProfileMessage('Vous devez êé··tre connecté pour enregistrer un profil.', 'error');
    return;
  }

  if (!profileForm) return;

  clearProfileMessage();

  // Construire l'objet profil
  const profileData = {
    id: currentUser.id,
    username: profileForm.username ? profileForm.username.value.trim() : null,
    full_name: profileForm.full_name ? profileForm.full_name.value.trim() : null,
    email: profileForm.email ? profileForm.email.value.trim() : null,
    phone: profileForm.phone ? profileForm.phone.value.trim() : null,
    address: profileForm.address ? profileForm.address.value.trim() : null,
    city: profileForm.city ? profileForm.city.value.trim() : null,
    zip: profileForm.zip ? profileForm.zip.value.trim() : null,
    country: profileForm.country ? profileForm.country.value.trim() : null,
  };

  if (saveProfileBtn) saveProfileBtn.disabled = true;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select();

    if (error) {
      showProfileMessage('É·É·chec de l'enregistrement : ' + error.message, 'error');
      console.error('Erreur Supabase lors de l'upsert du profil :', error);
      if (saveProfileBtn) saveProfileBtn.disabled = false;
      return;
    }

    showProfileMessage('Profil enregistré avec succès.', 'success');

    // Fermer la modale après un court délai
    setTimeout(() => {
      closeProfileModal();
    }, 900);
  } catch (err) {
    showProfileMessage('Erreur inattendue lors de l'enregistrement.', 'error');
    console.error(err);
    if (saveProfileBtn) saveProfileBtn.disabled = false;
  }
}

// Initialisation de l'auth
async function initAuth() {
  // Véé··rifier la session au chargement
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (profileBtn) profileBtn.style.display = 'inline-block';
  } else {
    currentUser = null;
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'none';
  }

  // Éé··couteurs globaux
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      await supabase.auth.signInWithPopup({
        provider: 'google',
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.reload();
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (!currentUser) {
        alert('Veuillez vous connecter pour accéder à votre profil.');
        return;
      }
      openProfileModal();
    });
  }

  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closeProfileModal);
  }

  if (profileOverlay) {
    profileOverlay.addEventListener('click', closeProfileModal);
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveProfile);
  }

  // ÉÉ·É·couter les changements d'auth (connexion / déconnexion)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (profileBtn) profileBtn.style.display = 'inline-block';
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'none';
      if (profileModal) profileModal.style.display = 'none';
    }
  });
}

// Déé··marrage
document.addEventListener('DOMContentLoaded', initAuth);