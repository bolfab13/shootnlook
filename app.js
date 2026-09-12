document.addEventListener('DOMContentLoaded', () => {
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const layout = document.querySelector('.layout');
  const euro = n => `${Number(n || 0).toFixed(2)} EUR`;
  const toLocalISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateNow = () => toLocalISO(new Date());
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const titles = {
    dashboard: 'Tableau de bord', calendrier: 'Calendrier', ecuries: 'Ecuries', cavaliers: 'Cavalier(e)s', shootings: 'Shootings', prestations: 'Grille tarifaire', facturation: 'Creer une facture', factures: 'Factures emises', reglages: 'Reglages'
  };

  let settings = {
    id: null, nom_entreprise: '', adresse: '', code_postal_entreprise: '', ville_entreprise: '', siret: '', logo_url: '', domicile_adresse: '', domicile_latitude: null, domicile_longitude: null, puissance_fiscale_cv: 4, taux_km: .606, mention_tva: 'TVA non applicable, art. 293 B du CGI', prefixe_facture: 'FACT-2026-', prochain_numero_facture: 1, vehicule_marque: '', vehicule_modele: '', vehicule_annee: null, vehicule_energie: 'essence', rappels_jours: [30, 14, 7, 2, 1], rappel_affichage_limite: 3, types_paiement: ['espece', 'cheque', 'virement', 'sans_contact'], shootings_afficher_a_venir: true
  };

  let chart = null, map = null, currentEcurie = null, currentCavaliere = null, currentShooting = null, currentService = null, ecuries = [], cavaliers = [], shootings = [], services = [], calCursor = new Date(), bellItemsCache = [], unpaidItems = [];

  function shootingIsUpcoming(shooting) {
    const endDate = shooting.date_fin || shooting.date_debut;
    return endDate >= dateNow();
  }

  function renderShootingsTable() {
    const table = $('table-shootings');
    if (!table) return;
    const showUpcomingOnly = $('filtre-shootings-a-venir')?.checked ?? settings.shootings_afficher_a_venir ?? true;
    const displayedShootings = showUpcomingOnly ? shootings.filter(shootingIsUpcoming) : shootings;
    table.querySelector('tbody').innerHTML = displayedShootings.map(s => `<tr data-shooting-id="${s.id}"><td>${safe(s.nom)}</td><td>${s.type_shooting === 'concours' ? 'Concours' : 'Shooting perso.'}</td><td>${safe(s.ecuries?.nom || s.lieu || '-')}</td><td>${s.cavalieres ? `${safe(s.cavalieres.prenom)} ${safe(s.cavalieres.nom)}` : '-'}</td><td>${safe(s.date_debut)}${s.date_fin && s.date_fin !== s.date_debut ? ` -> ${s.date_fin}` : ''}</td><td><span class="badge-statut badge-${shootingIsUpcoming(s) ? 'a-venir' : 'termine'}">${shootingIsUpcoming(s) ? 'A venir' : 'Termine'}</span></td><td><button data-edit-shooting="${s.id}">Modifier</button><button class="btn-danger" data-delete-shooting="${s.id}">Supprimer</button></td></tr>`).join('') || '<tr><td colspan="7">Aucun shooting correspondant</td></tr>';
    document.querySelectorAll('[data-edit-shooting]').forEach(b => b.onclick = () => editShooting(b.dataset.editShooting));
    document.querySelectorAll('[data-delete-shooting]').forEach(b => b.onclick = () => deleteShooting(b.dataset.deleteShooting));
  }

  $('filtre-shootings-a-venir')?.addEventListener('change', renderShootingsTable);

  async function loadShootings() {
    const { data, error } = await db.from('concours').select('*,ecuries(nom),cavalieres(nom,prenom)').order('date_debut');
    if (error) return console.error(error);
    shootings = data || [];
    renderShootingsTable();
    refreshBell();
    renderCalendar();
  }

  async function loadSettings() {
    const { data, error } = await db.from('reglages').select('*').limit(1).single();
    if (error) return console.error(error);
    if (!data) return;
    settings = { ...settings, ...data, shootings_afficher_a_venir: data.shootings_afficher_a_venir ?? settings.shootings_afficher_a_venir };
    if ($('rg-shootings-a-venir')) $('rg-shootings-a-venir').checked = settings.shootings_afficher_a_venir;
  }

  $('form-reglages')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { error } = await db.from('reglages').update({ shootings_afficher_a_venir: $('rg-shootings-a-venir')?.checked ?? true }).eq('id', settings.id);
    if (error) return alert(error.message);
    await loadSettings();
    renderShootingsTable();
  });

  async function init() {
    await loadSettings();
    await loadShootings();
  }

  init();
});