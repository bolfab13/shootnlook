document.addEventListener('DOMContentLoaded', () => {
  const db = window.supabase && window.supabase.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  const layout = document.querySelector('.layout');
  const titles = { dashboard:'Tableau de bord', ecuries:'Écuries', cavalieres:'Cavalières', concours:'Concours', prestations:'Grille tarifaire', facturation:'Créer une facture', factures:'Factures émises', reglages:'Réglages' };
  document.querySelectorAll('#tabs button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    $(button.dataset.tab)?.classList.add('active');
    if ($('page-title')) $('page-title').textContent = titles[button.dataset.tab] || '';
    layout?.classList.remove('mobile-menu');
  }));
  $('sidebar-toggle')?.addEventListener('click', () => layout?.classList.toggle('mobile-menu'));
  $('user-toggle')?.addEventListener('click', () => $('user-menu')?.classList.toggle('open'));
  $('edit-profile-btn')?.addEventListener('click', () => $('profile-modal')?.classList.add('visible'));
  $('close-profile-modal')?.addEventListener('click', () => $('profile-modal')?.classList.remove('visible'));
  $('open-profile-modal')?.addEventListener('click', () => $('profile-modal')?.classList.add('visible'));
  if (db) console.info('Supabase client initialized');
});