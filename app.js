document.addEventListener('DOMContentLoaded', () => {
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const layout = document.querySelector('.layout');
  const euro = n => `${Number(n || 0).toFixed(2)} EUR`;
  const dateNow = () => new Date().toISOString().slice(0, 10);
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const titles = {
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

  let settings = {
    id: null,
    nom_entreprise: '',
    adresse: '',
    code_postal_entreprise: '',
    ville_entreprise: '',
    siret: '',
    logo_url: '',
    domicile_adresse: '',
    domicile_latitude: null,
    domicile_longitude: null,
    puissance_fiscale_cv: 4,
    taux_km: .606,
    mention_tva: 'TVA non applicable, art. 293 B du CGI',
    prefixe_facture: 'FACT-2026-',
    prochain_numero_facture: 1,
    vehicule_marque: '',
    vehicule_modele: '',
    vehicule_annee: null,
    vehicule_energie: 'essence',
    rappels_jours: [30, 14, 7, 2, 1],
    rappel_affichage_limite: 3,
    types_paiement: ['espece', 'cheque', 'virement', 'sans_contact']
  };

  let chart = null;
  let map = null;
  let currentEcurie = null;
  let currentCavaliere = null;
  let currentShooting = null;
  let ecuries = [];
  let cavaliers = [];
  let shootings = [];
  let calCursor = new Date();
  let bellItemsCache = [];
  let unpaidItems = [];

  const defaultIcons = {
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

  const lightPalettes = {
    classic: {
      '--bg-body': '#F5F6F8', '--bg-card': '#FFFFFF', '--bg-input': '#FFFFFF',
      '--text-main': '#343A40', '--text-secondary': '#74788D', '--border': '#E9ECEF',
      '--table-header': '#F8F9FA', '--table-hover': '#F8F9FA', '--sidebar-bg': '#2A3042',
      '--sidebar-text': '#A6B0CF', '--sidebar-active': '#556EE6', '--accent': '#556EE6',
      '--accent-hover': '#485EC4', '--secondary': '#74788D', '--secondary-hover': '#5F6375',
      '--success': '#34C38F', '--success-bg': '#E6F8F1', '--warning': '#F1B44C',
      '--warning-bg': '#FFF6E5', '--danger': '#F46A6A', '--danger-bg': '#FEECEC',
      '--info': '#50A5F1', '--info-bg': '#EAF5FE'
    },
    girly: {
      '--bg-body': '#FFF7FB', '--bg-card': '#FFFFFF', '--bg-input': '#FFFFFF',
      '--text-main': '#BD4F85', '--text-secondary': '#D96A9D', '--border': '#F0CFDE',
      '--table-header': '#FFF0F6', '--table-hover': '#FFF5F9', '--sidebar-bg': '#4A3040',
      '--sidebar-text': '#F2C7DB', '--sidebar-active': '#D96A9D', '--accent': '#D96A9D',
      '--accent-hover': '#BD4F85', '--secondary': '#A95E80', '--secondary-hover': '#8B4668',
      '--success': '#63B99B', '--success-bg': '#E9F8F0', '--warning': '#D99748',
      '--warning-bg': '#FFF4DF', '--danger': '#DF7386', '--danger-bg': '#FFECEF',
      '--info': '#A779CE', '--info-bg': '#F3EAFA'
    },
    campagne: {
      '--bg-body': '#F6F3EA', '--bg-card': '#FFFDF7', '--bg-input': '#FFFFFF',
      '--text-main': '#354337', '--text-secondary': '#6F8F68', '--border': '#D9D7C9',
      '--table-header': '#ECE8DC', '--table-hover': '#F3F0E6', '--sidebar-bg': '#354337',
      '--sidebar-text': '#C8D6B8', '--sidebar-active': '#6F8F68', '--accent': '#6F8F68',
      '--accent-hover': '#587451', '--secondary': '#72866F', '--secondary-hover': '#596E57',
      '--success': '#83A76F', '--success-bg': '#EDF4E8', '--warning': '#BF944E',
      '--warning-bg': '#FBF2E0', '--danger': '#BF6E5F', '--danger-bg': '#FBEAE6',
      '--info': '#628AA0', '--info-bg': '#E8F1F3'
    },
    vegetal: {
      '--bg-body': '#F4F7F0', '--bg-card': '#FFFFFF', '--bg-input': '#F9FBF7',
      '--text-main': '#2B3A28', '--text-secondary': '#5A6B54', '--border': '#D4E0CC',
      '--table-header': '#E8F0E0', '--table-hover': '#F0F7EB', '--sidebar-bg': '#2D5016',
      '--sidebar-text': '#C8D6B8', '--sidebar-active': '#5D8A2F', '--accent': '#5D8A2F',
      '--accent-hover': '#4A7024', '--secondary': '#62785A', '--secondary-hover': '#4C6246',
      '--success': '#6B9B3F', '--success-bg': '#E8F5D9', '--warning': '#D4A04B',
      '--warning-bg': '#FFF8E6', '--danger': '#C95A49', '--danger-bg': '#FCEAE8',
      '--info': '#4A8F6A', '--info-bg': '#E0F0E8'
    }
  };

  const darkPalettes = {
    classic: {
      '--bg-body': '#1A1F2B', '--bg-card': '#222838', '--bg-input': '#2A3143',
      '--text-main': '#EEF2F8', '--text-secondary': '#AEB8CA', '--border': '#3A4357',
      '--table-header': '#283043', '--table-hover': '#313B50', '--sidebar-bg': '#161B27',
      '--sidebar-text': '#AAB6CF', '--sidebar-active': '#6178E8', '--accent': '#7187EF',
      '--accent-hover': '#91A2FF', '--secondary': '#758096', '--secondary-hover': '#8B97AE',
      '--success': '#4FCA96', '--success-bg': '#1D4137', '--warning': '#F1BB56',
      '--warning-bg': '#49391D', '--danger': '#F17A7A', '--danger-bg': '#4A292F',
      '--info': '#67B2F6', '--info-bg': '#203D57'
    },
    girly: {
      '--bg-body': '#241B23', '--bg-card': '#30212D', '--bg-input': '#3A2836',
      '--text-main': '#F7EAF1', '--text-secondary': '#DFB5CA', '--border': '#573C4D',
      '--table-header': '#3B2836', '--table-hover': '#48313F', '--sidebar-bg': '#21151D',
      '--sidebar-text': '#EFC9DB', '--sidebar-active': '#B95787', '--accent': '#EA7EAE',
      '--accent-hover': '#F2A0C5', '--secondary': '#A56883', '--secondary-hover': '#C47E9D',
      '--success': '#71C9AB', '--success-bg': '#1E433A', '--warning': '#E9AE61',
      '--warning-bg': '#4C371F', '--danger': '#EC8197', '--danger-bg': '#4B2934',
      '--info': '#BA8CDD', '--info-bg': '#3E2B4C'
    },
    campagne: {
      '--bg-body': '#1E251E', '--bg-card': '#283126', '--bg-input': '#323C2F',
      '--text-main': '#EDF3E8', '--text-secondary': '#BAC9B3', '--border': '#465342',
      '--table-header': '#323C30', '--table-hover': '#3B4938', '--sidebar-bg': '#192019',
      '--sidebar-text': '#D1DFC6', '--sidebar-active': '#6F9469', '--accent': '#8EAE82',
      '--accent-hover': '#ABC89D', '--secondary': '#7C9575', '--secondary-hover': '#98B290',
      '--success': '#9ABB7D', '--success-bg': '#33452D', '--warning': '#D6AD68',
      '--warning-bg': '#4A3A22', '--danger': '#D98573', '--danger-bg': '#4C2E2A',
      '--info': '#79A5B8', '--info-bg': '#273D46'
    },
    vegetal: {
      '--bg-body': '#172218', '--bg-card': '#202D21', '--bg-input': '#293829',
      '--text-main': '#EDF6E9', '--text-secondary': '#B3C6AD', '--border': '#3D513D',
      '--table-header': '#2A3929', '--table-hover': '#344633', '--sidebar-bg': '#142014',
      '--sidebar-text': '#CBE0C4', '--sidebar-active': '#5B8B43', '--accent': '#78AD59',
      '--accent-hover': '#9BC87C', '--secondary': '#6D8961', '--secondary-hover': '#8DAA7F',
      '--success': '#82B95D', '--success-bg': '#2D4525', '--warning': '#D5AA55',
      '--warning-bg': '#4B3B1D', '--danger': '#D86C59', '--danger-bg': '#4C2926',
      '--info': '#5DA681', '--info-bg': '#244338'
    }
  };

  const themeColorLabels = {
    '--bg-body': 'Fond général', '--bg-card': 'Fond des cartes', '--bg-input': 'Fond des champs',
    '--text-main': 'Texte principal', '--text-secondary': 'Texte secondaire', '--border': 'Bordures',
    '--table-header': 'En-tête de tableau', '--table-hover': 'Ligne de tableau au survol',
    '--sidebar-bg': 'Fond du menu', '--sidebar-text': 'Texte du menu', '--sidebar-active': 'Élément actif du menu',
    '--accent': 'Couleur principale', '--accent-hover': 'Couleur principale au survol',
    '--secondary': 'Boutons secondaires', '--secondary-hover': 'Boutons secondaires au survol',
    '--success': 'Succès', '--success-bg': 'Fond succès', '--warning': 'Avertissement',
    '--warning-bg': 'Fond avertissement', '--danger': 'Erreur / suppression', '--danger-bg': 'Fond erreur',
    '--info': 'Information', '--info-bg': 'Fond information'
  };

  function getIcons() {
    try { return JSON.parse(localStorage.getItem('boxicons_menu')) || {}; }
    catch { return {}; }
  }

  function applyIcons() {
    const x = getIcons();
    document.querySelectorAll('#tabs button[data-tab]').forEach(b => {
      const i = b.querySelector('.icon');
      if (i) {
        i.className = `icon ${x[b.dataset.tab] || defaultIcons[b.dataset.tab]}`;
        i.textContent = '';
      }
    });
    document.querySelectorAll('[data-preview-icon]').forEach(i => {
      i.className = x[i.dataset.previewIcon] || defaultIcons[i.dataset.previewIcon];
    });
  }

  function initIconFields() {
    const x = getIcons();
    document.querySelectorAll('[data-menu-icon]').forEach(i => {
      const n = i.dataset.menuIcon;
      i.value = x[n] || defaultIcons[n];
      i.addEventListener('input', () => {
        const z = getIcons();
        z[n] = i.value.trim() || defaultIcons[n];
        localStorage.setItem('boxicons_menu', JSON.stringify(z));
        applyIcons();
      });
    });
  }

  function getThemePaletteOverrides() {
    try { return JSON.parse(localStorage.getItem('themePaletteOverrides') || '{}'); }
    catch { return {}; }
  }

  function saveThemePaletteOverrides(overrides) {
    localStorage.setItem('themePaletteOverrides', JSON.stringify(overrides));
  }

  function getPaletteColors(themeName) {
    const palette = themeName || root.dataset.colorTheme || 'classic';
    const mode = root.dataset.theme === 'dark' ? 'dark' : 'light';
    const baseName = palette === 'custom' ? 'classic' : palette;
    const base = (mode === 'dark' ? darkPalettes : lightPalettes)[baseName] || (mode === 'dark' ? darkPalettes.classic : lightPalettes.classic);
    const overrides = getThemePaletteOverrides();
    return { ...base, ...(overrides[palette]?.[mode] || {}) };
  }

  /*function applyPaletteColors(themeName) {
    const colors = getPaletteColors(themeName);
    root.removeAttribute('style');
    Object.entries(colors).forEach(([variable, value]) => root.style.setProperty(variable, value));
    if (chart) {
      chart.destroy();
      chart = null;
      loadDashboard();
    }
  }
*/
function applyPaletteColors(themeName) {
  const activeTheme = themeName || root.dataset.colorTheme || 'classic';
  const colors = getPaletteColors(activeTheme);

  root.removeAttribute('style');

  if (activeTheme !== 'classic') {
    Object.entries(colors).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }

  if (chart) {
    chart.destroy();
    chart = null;
    loadDashboard();
  }
}  
  function renderThemeColorFields() {
    const container = $('theme-color-fields');
    if (!container) return;
    const palette = root.dataset.colorTheme || 'classic';
    const colors = getPaletteColors(palette);
    container.innerHTML = Object.entries(themeColorLabels).map(([variable, label]) => {
      const color = String(colors[variable] || '#000000').toUpperCase();
      return `<label class="theme-color-field"><span class="theme-color-label">${label}</span><input type="color" data-theme-color="${variable}" value="${color}" aria-label="${label}"><code class="theme-color-hex" data-theme-color-hex="${variable}">${color}</code></label>`;
    }).join('');
    container.querySelectorAll('[data-theme-color]').forEach(input => {
      input.addEventListener('input', event => {
        const paletteName = root.dataset.colorTheme || 'classic';
        const mode = root.dataset.theme === 'dark' ? 'dark' : 'light';
        const variable = event.target.dataset.themeColor;
        const value = event.target.value.toUpperCase();
        const overrides = getThemePaletteOverrides();
        overrides[paletteName] = overrides[paletteName] || {};
        overrides[paletteName][mode] = { ...(overrides[paletteName][mode] || {}), [variable]: value };
        saveThemePaletteOverrides(overrides);
        const hex = container.querySelector(`[data-theme-color-hex="${variable}"]`);
        if (hex) hex.textContent = value;
        applyPaletteColors(paletteName);
      });
    });
  }

  function resetThemeColors() {
    const palette = root.dataset.colorTheme || 'classic';
    const mode = root.dataset.theme === 'dark' ? 'dark' : 'light';
    const overrides = getThemePaletteOverrides();
    if (overrides[palette]) delete overrides[palette][mode];
    saveThemePaletteOverrides(overrides);
    applyPaletteColors(palette);
    renderThemeColorFields();
  }

  function setTheme(value) {
    const theme = value === 'dark' ? 'dark' : 'light';
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    if ($('setting-theme')) $('setting-theme').value = theme;
    if ($('setting-theme-palette')) $('setting-theme-palette').value = theme;
    applyPaletteColors(root.dataset.colorTheme || 'classic');
    renderThemeColorFields();
  }

  function setColorTheme(value) {
    const palette = ['classic', 'girly', 'campagne', 'vegetal', 'custom'].includes(value) ? value : 'classic';
    root.dataset.colorTheme = palette;
    localStorage.setItem('colorTheme', palette);
    if ($('setting-color-theme')) $('setting-color-theme').value = palette;
    applyPaletteColors(palette);
    renderThemeColorFields();
  }

  function setLayout(value) {
    root.dataset.layout = value;
    localStorage.setItem('layout', value);
    if ($('setting-layout')) $('setting-layout').value = value;
  }

  function setSidebar(value) {
    root.dataset.sidebar = value;
    localStorage.setItem('sidebar', value);
    if ($('setting-sidebar')) $('setting-sidebar').value = value;
  }

  function closeMenus() {
    ['settings-menu', 'user-menu', 'bell-menu', 'unpaid-menu'].forEach(id => $(id)?.classList.remove('open'));
  }

  function openTab(name) {
    document.querySelector(`#tabs button[data-tab="${name}"]`)?.click();
  }

  function loadLocalProfile() {
    const p = localStorage.getItem('profil_pseudo') || 'Admin';
    const s = localStorage.getItem('profil_societe') || '';
    const a = localStorage.getItem('profil_adresse') || '';
    const cp = localStorage.getItem('profil_code_postal') || '';
    const v = localStorage.getItem('profil_ville') || '';
    [['pf-pseudo', p], ['pf-societe', s], ['pf-adresse', a], ['pf-code-postal', cp], ['pf-ville', v], ['topbar-user-name', p], ['menu-user-name', p], ['dashboard-user-name', p]].forEach(([id, value]) => {
      if ($(id)) $(id).value !== undefined ? $(id).value = value : $(id).textContent = value;
    });
    document.querySelectorAll('.user-avatar').forEach(x => x.textContent = p[0]?.toUpperCase() || 'A');
  }

  document.querySelectorAll('#tabs button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    $(button.dataset.tab)?.classList.add('active');
    if ($('page-title')) $('page-title').textContent = titles[button.dataset.tab] || '';
    layout?.classList.remove('mobile-menu');
    closeMenus();
    if (button.dataset.tab === 'dashboard') loadDashboard();
    if (button.dataset.tab === 'calendrier') renderCalendar();
  }));

  $('sidebar-toggle')?.addEventListener('click', () => innerWidth <= 780 ? layout?.classList.toggle('mobile-menu') : setSidebar(root.dataset.sidebar === 'compact' ? 'normal' : 'compact'));
  $('settings-toggle')?.addEventListener('click', e => { e.stopPropagation(); closeMenus(); $('settings-menu')?.classList.toggle('open'); });
  $('user-toggle')?.addEventListener('click', e => { e.stopPropagation(); closeMenus(); $('user-menu')?.classList.toggle('open'); });
  $('bell-toggle')?.addEventListener('click', e => { e.stopPropagation(); closeMenus(); $('bell-menu')?.classList.toggle('open'); });
  $('unpaid-toggle')?.addEventListener('click', e => { e.stopPropagation(); closeMenus(); $('unpaid-menu')?.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!e.target.closest('.topbar-menu-wrap')) closeMenus(); });

  $('setting-theme')?.addEventListener('change', e => setTheme(e.target.value));
  $('setting-theme-palette')?.addEventListener('change', e => setTheme(e.target.value));
  $('setting-layout')?.addEventListener('change', e => setLayout(e.target.value));
  $('setting-sidebar')?.addEventListener('change', e => setSidebar(e.target.value));
  $('setting-color-theme')?.addEventListener('change', e => setColorTheme(e.target.value));
  $('reset-theme-colors')?.addEventListener('click', resetThemeColors);
  $('save-custom-theme')?.addEventListener('click', () => alert('Couleurs du theme enregistrees'));

  $('open-reglages-btn')?.addEventListener('click', () => { closeMenus(); openTab('reglages'); });
  $('edit-profile-btn')?.addEventListener('click', () => { $('profile-modal')?.classList.add('visible'); closeMenus(); });
  $('fermer-profil')?.addEventListener('click', () => $('profile-modal')?.classList.remove('visible'));
  $('fermer-notifs')?.addEventListener('click', () => $('modal-notifs')?.classList.remove('visible'));
  $('fermer-facture')?.addEventListener('click', () => $('modal-facture')?.classList.remove('visible'));
  document.querySelectorAll('[data-open-tab]').forEach(b => b.addEventListener('click', () => openTab(b.dataset.openTab)));

  $('form-profil')?.addEventListener('submit', async e => {
    e.preventDefault();
    const p = $('pf-pseudo').value.trim() || 'Admin';
    const s = $('pf-societe').value.trim();
    const a = $('pf-adresse').value.trim();
    const cp = $('pf-code-postal').value.trim();
    const v = $('pf-ville').value.trim();
    localStorage.setItem('profil_pseudo', p);
    localStorage.setItem('profil_societe', s);
    localStorage.setItem('profil_adresse', a);
    localStorage.setItem('profil_code_postal', cp);
    localStorage.setItem('profil_ville', v);
    if (settings.id) await db.from('reglages').update({ nom_entreprise: s, adresse: a, code_postal_entreprise: cp, ville_entreprise: v }).eq('id', settings.id);
    loadLocalProfile();
    $('profile-modal')?.classList.remove('visible');
  });

  async function geocode(query) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=fr&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language': 'fr' } });
      return await r.json();
    } catch { return []; }
  }

  async function road(a, b, c, d) {
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${b},${a};${d},${c}?overview=false`);
      const x = await r.json();
      return x.routes?.[0] ? x.routes[0].distance / 1000 : null;
    } catch { return null; }
  }

  function displayStableSearchResults(results) {
    const box = $('ec-recherche-resultats');
    if (!box) return;
    if (!results.length) {
      box.innerHTML = '<p class="aide">Aucune ecurie trouvee. Tu peux la saisir manuellement ci-dessous.</p>';
      box.classList.add('visible');
      return;
    }
    box.innerHTML = results.map((r, i) => {
      const a = r.address || {};
      const city = a.city || a.town || a.village || a.municipality || '';
      return `<button type="button" class="stable-result" data-result-index="${i}"><strong>${safe(r.name || r.display_name?.split(',')[0] || '')}</strong><span>${safe(r.display_name || '')}</span><small>${safe(a.postcode || '')} ${safe(city)}</small></button>`;
    }).join('');
    box.classList.add('visible');
    box.querySelectorAll('[data-result-index]').forEach(b => b.onclick = () => selectStableSearchResult(results[Number(b.dataset.resultIndex)]));
  }

  function selectStableSearchResult(r) {
    const a = r.address || {};
    if ($('ec-nom')) $('ec-nom').value = r.name || r.display_name?.split(',')[0] || '';
    if ($('ec-adresse')) $('ec-adresse').value = `${a.house_number || ''} ${a.road || a.pedestrian || ''}`.trim();
    if ($('ec-cp')) $('ec-cp').value = a.postcode || '';
    if ($('ec-ville')) $('ec-ville').value = a.city || a.town || a.village || a.municipality || '';
    if ($('ec-lat')) $('ec-lat').value = r.lat || '';
    if ($('ec-lon')) $('ec-lon').value = r.lon || '';
    if ($('ec-coords-statut')) $('ec-coords-statut').textContent = 'Coordonnees trouvees';
    $('ec-recherche-resultats')?.classList.remove('visible');
  }

  $('ec-rechercher')?.addEventListener('click', async () => {
    const nom = $('ec-recherche-nom')?.value.trim() || '';
    const ville = $('ec-recherche-ville')?.value.trim() || '';
    if (!nom && !ville) return alert('Saisis un nom ou une ville.');
    const btn = $('ec-rechercher');
    btn.disabled = true;
    btn.textContent = 'Recherche...';
    displayStableSearchResults(await geocode(`${nom} ${ville} France`));
    btn.disabled = false;
    btn.textContent = 'Rechercher';
  });

  function paymentLabel(value) {
    return { espece: 'Espece', cheque: 'Cheque', virement: 'Virement', sans_contact: 'Sans contact' }[value] || value;
  }

  function renderPaymentOptions() {
    const opts = (settings.types_paiement || []).map(v => `<option value="${v}">${paymentLabel(v)}</option>`).join('');
    if ($('fa-paiement')) $('fa-paiement').innerHTML = '<option value="">-- Type de paiement --</option>' + opts;
    if ($('filtre-paiement')) $('filtre-paiement').innerHTML = '<option value="">Tous les paiements</option>' + opts;
  }

  function nomEntreprise(name) {
    if ($('sidebar-company-name')) $('sidebar-company-name').textContent = String(name || '').trim() || 'PHOTO EQUESTRE';
  }

  async function loadSettings() {
    const { data, error } = await db.from('reglages').select('*').limit(1).single();
    if (error) return console.error(error);
    if (!data) return;
    settings = { ...settings, ...data, rappels_jours: data.rappels_jours?.length ? data.rappels_jours : settings.rappels_jours, rappel_affichage_limite: data.rappel_affichage_limite || 3, types_paiement: data.types_paiement?.length ? data.types_paiement : settings.types_paiement };
    [['rg-nom-entreprise', data.nom_entreprise], ['rg-adresse-entreprise', data.adresse], ['rg-code-postal-entreprise', data.code_postal_entreprise], ['rg-ville-entreprise', data.ville_entreprise], ['rg-siret', data.siret], ['rg-domicile-adresse', data.domicile_adresse], ['rg-domicile-lat', data.domicile_latitude], ['rg-domicile-lon', data.domicile_longitude], ['rg-cv', data.puissance_fiscale_cv || 4], ['rg-taux', data.taux_km || .606], ['rg-tva', data.mention_tva], ['rg-prefixe', data.prefixe_facture], ['rg-vehicule-marque', data.vehicule_marque], ['rg-vehicule-modele', data.vehicule_modele], ['rg-vehicule-annee', data.vehicule_annee], ['rg-vehicule-energie', data.vehicule_energie || 'essence'], ['rg-bell-limite', settings.rappel_affichage_limite]].forEach(([id, value]) => { if ($(id)) $(id).value = value ?? ''; });
    document.querySelectorAll('.rg-rappel').forEach(c => c.checked = settings.rappels_jours.includes(Number(c.value)));
    document.querySelectorAll('.rg-paiement').forEach(c => c.checked = settings.types_paiement.includes(c.value));
    nomEntreprise(data.nom_entreprise);
    loadLocalProfile();
    renderPaymentOptions();
  }

  $('form-reglages')?.addEventListener('submit', async e => {
    e.preventDefault();
    const p = {
      nom_entreprise: $('rg-nom-entreprise')?.value || '', adresse: $('rg-adresse-entreprise')?.value || '', code_postal_entreprise: $('rg-code-postal-entreprise')?.value || '', ville_entreprise: $('rg-ville-entreprise')?.value || '', siret: $('rg-siret')?.value || '', domicile_adresse: $('rg-domicile-adresse')?.value || '', domicile_latitude: $('rg-domicile-lat')?.value || null, domicile_longitude: $('rg-domicile-lon')?.value || null, puissance_fiscale_cv: $('rg-cv')?.value || 4, taux_km: $('rg-taux')?.value || .606, mention_tva: $('rg-tva')?.value || '', prefixe_facture: $('rg-prefixe')?.value || '', vehicule_marque: $('rg-vehicule-marque')?.value || '', vehicule_modele: $('rg-vehicule-modele')?.value || '', vehicule_annee: $('rg-vehicule-annee')?.value || null, vehicule_energie: $('rg-vehicule-energie')?.value || 'essence', rappels_jours: Array.from(document.querySelectorAll('.rg-rappel:checked')).map(c => Number(c.value)), rappel_affichage_limite: Number($('rg-bell-limite')?.value) || 3, types_paiement: Array.from(document.querySelectorAll('.rg-paiement:checked')).map(c => c.value)
    };
    if (!p.rappels_jours.length) p.rappels_jours = [7];
    if (!p.types_paiement.length) p.types_paiement = ['espece', 'cheque', 'virement', 'sans_contact'];
    const file = $('rg-logo')?.files?.[0];
    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const upload = await db.storage.from('logos').upload(path, file, { upsert: true });
      if (!upload.error) p.logo_url = db.storage.from('logos').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await db.from('reglages').update(p).eq('id', settings.id);
    if (error) return alert(error.message);
    await loadSettings();
    refreshBell();
    alert('Reglages enregistres');
  });

  async function loadStables() {
    const { data, error } = await db.from('ecuries').select('*').order('nom');
    if (error) return console.error(error);
    ecuries = data || [];
    const { data: riders } = await db.from('cavalieres').select('id,ecurie_id');
    if ($('table-ecuries')) $('table-ecuries').querySelector('tbody').innerHTML = ecuries.map(e => `<tr><td>${safe(e.nom)}</td><td>${safe(e.adresse || '')}</td><td>${safe(e.code_postal || '')}</td><td>${safe(e.ville || '')}</td><td>${e.distance_domicile_km ? Number(e.distance_domicile_km).toFixed(1) + ' km A/R' : '-'}</td><td>${(riders || []).filter(r => r.ecurie_id === e.id).length}</td><td><button data-edit-stable="${e.id}">Modifier</button><button class="btn-danger" data-delete-stable="${e.id}">Supprimer</button></td></tr>`).join('');
    document.querySelectorAll('[data-edit-stable]').forEach(b => b.onclick = () => editStable(b.dataset.editStable));
    document.querySelectorAll('[data-delete-stable]').forEach(b => b.onclick = () => deleteStable(b.dataset.deleteStable));
    const options = ecuries.map(e => `<option value="${e.id}">${safe(e.nom)}</option>`).join('');
    if ($('cav-ecurie')) $('cav-ecurie').innerHTML = '<option value="">-- Ecurie --</option>' + options;
    if ($('sh-ecurie')) $('sh-ecurie').innerHTML = '<option value="">-- Ecurie / lieu --</option>' + options;
  }

  function editStable(id) {
    const e = ecuries.find(x => String(x.id) === String(id));
    if (!e) return;
    currentEcurie = id;
    [['ec-nom', e.nom], ['ec-ville', e.ville], ['ec-adresse', e.adresse], ['ec-cp', e.code_postal], ['ec-contact-nom', e.contact_nom], ['ec-lat', e.latitude], ['ec-lon', e.longitude]].forEach(([key, value]) => { if ($(key)) $(key).value = value || ''; });
    if ($('ec-submit-btn')) $('ec-submit-btn').textContent = 'Enregistrer';
    if ($('ec-annuler')) $('ec-annuler').style.display = 'inline-block';
    openTab('ecuries');
  }

  $('ec-annuler')?.addEventListener('click', () => { currentEcurie = null; $('form-ecurie')?.reset(); if ($('ec-submit-btn')) $('ec-submit-btn').textContent = 'Ajouter'; $('ec-annuler').style.display = 'none'; });

  async function deleteStable(id) {
    if (!confirm('Supprimer cette ecurie ?')) return;
    const { error } = await db.from('ecuries').delete().eq('id', id);
    if (error) return alert(error.message);
    loadStables();
  }

  $('form-ecurie')?.addEventListener('submit', async e => {
    e.preventDefault();
    const lat = $('ec-lat')?.value || null;
    const lon = $('ec-lon')?.value || null;
    const distance = lat && lon && settings.domicile_latitude && settings.domicile_longitude ? await road(settings.domicile_latitude, settings.domicile_longitude, lat, lon) : null;
    const p = { nom: $('ec-nom').value, ville: $('ec-ville').value, adresse: $('ec-adresse')?.value || null, code_postal: $('ec-cp')?.value || null, contact_nom: $('ec-contact-nom')?.value || null, latitude: lat, longitude: lon, distance_domicile_km: distance };
    const result = currentEcurie ? await db.from('ecuries').update(p).eq('id', currentEcurie) : await db.from('ecuries').insert(p);
    if (result.error) return alert(result.error.message);
    $('ec-annuler')?.click();
    loadStables();
  });

  async function loadRiders() {
    const { data, error } = await db.from('cavalieres').select('*,ecuries(nom)').order('prenom');
    if (error) return console.error(error);
    cavaliers = data || [];
    const { data: invoices } = await db.from('factures').select('id,cavaliere_id');
    const query = ($('filtre-cavalieres')?.value || '').toLowerCase();
    const filtered = cavaliers.filter(c => `${c.prenom || ''} ${c.nom || ''} ${c.ecuries?.nom || ''}`.toLowerCase().includes(query));
    if ($('table-cavalieres')) $('table-cavalieres').querySelector('tbody').innerHTML = filtered.map(c => `<tr><td>${safe(c.prenom)}</td><td>${safe(c.nom)}</td><td>${safe(c.ecuries?.nom || '-')}</td><td>${safe(c.nom_cheval || '-')}</td><td>${c.ambassadeur ? '<i class="bx bxs-star star-ambassadeur"></i> Oui' : 'Non'}</td><td>${(invoices || []).filter(f => f.cavaliere_id === c.id).length}</td><td><button data-edit-rider="${c.id}">Modifier</button><button class="btn-danger" data-delete-rider="${c.id}">Supprimer</button></td></tr>`).join('');
    document.querySelectorAll('[data-edit-rider]').forEach(b => b.onclick = () => editRider(b.dataset.editRider));
    document.querySelectorAll('[data-delete-rider]').forEach(b => b.onclick = () => deleteRider(b.dataset.deleteRider));
    const options = cavaliers.map(c => `<option value="${c.id}">${c.ambassadeur ? '* ' : ''}${safe(c.prenom)} ${safe(c.nom)}</option>`).join('');
    if ($('fa-cavaliere')) $('fa-cavaliere').innerHTML = '<option value="">-- Cavalier(e) --</option>' + options;
    if ($('sh-cavaliere')) $('sh-cavaliere').innerHTML = '<option value="">-- Cavalier(e) (optionnel) --</option>' + options;
  }

  function editRider(id) {
    const c = cavaliers.find(x => String(x.id) === String(id));
    if (!c) return;
    currentCavaliere = id;
    [['cav-prenom', c.prenom], ['cav-nom', c.nom], ['cav-ecurie', c.ecurie_id], ['cav-cheval', c.nom_cheval], ['cav-tel', c.telephone], ['cav-email', c.email]].forEach(([key, value]) => { if ($(key)) $(key).value = value || ''; });
    if ($('cav-ambassadeur')) $('cav-ambassadeur').checked = !!c.ambassadeur;
    if ($('cav-submit-btn')) $('cav-submit-btn').textContent = 'Enregistrer';
    if ($('cav-annuler')) $('cav-annuler').style.display = 'inline-block';
    openTab('cavaliers');
  }

  $('cav-annuler')?.addEventListener('click', () => { currentCavaliere = null; $('form-cavaliere')?.reset(); if ($('cav-submit-btn')) $('cav-submit-btn').textContent = 'Ajouter'; $('cav-annuler').style.display = 'none'; });

  async function deleteRider(id) {
    if (!confirm('Supprimer ce/cette cavalier(e) ?')) return;
    const { error } = await db.from('cavalieres').delete().eq('id', id);
    if (error) return alert(error.message);
    loadRiders();
  }

  $('form-cavaliere')?.addEventListener('submit', async e => {
    e.preventDefault();
    const p = { prenom: $('cav-prenom')?.value || null, nom: $('cav-nom')?.value || null, ecurie_id: $('cav-ecurie')?.value || null, nom_cheval: $('cav-cheval')?.value || null, telephone: $('cav-tel')?.value || null, email: $('cav-email')?.value || null, ambassadeur: $('cav-ambassadeur')?.checked || false };
    const result = currentCavaliere ? await db.from('cavalieres').update(p).eq('id', currentCavaliere) : await db.from('cavalieres').insert(p);
    if (result.error) return alert(result.error.message);
    $('cav-annuler')?.click();
    loadRiders();
  });
  $('filtre-cavalieres')?.addEventListener('input', loadRiders);

  async function loadShootings() {
    const { data, error } = await db.from('concours').select('*,ecuries(nom),cavalieres(nom,prenom)').order('date_debut');
    if (error) return console.error(error);
    shootings = data || [];
    if ($('table-shootings')) $('table-shootings').querySelector('tbody').innerHTML = shootings.map(s => `<tr data-shooting-id="${s.id}"><td>${safe(s.nom)}</td><td>${s.type_shooting === 'concours' ? 'Concours' : 'Shooting perso.'}</td><td>${safe(s.ecuries?.nom || s.lieu || '-')}</td><td>${s.cavalieres ? `${safe(s.cavalieres.prenom)} ${safe(s.cavalieres.nom)}` : '-'}</td><td>${safe(s.date_debut)}${s.date_fin && s.date_fin !== s.date_debut ? ` -> ${safe(s.date_fin)}` : ''}</td><td><button data-edit-shooting="${s.id}">Modifier</button><button class="btn-danger" data-delete-shooting="${s.id}">Supprimer</button></td></tr>`).join('');
    document.querySelectorAll('[data-edit-shooting]').forEach(b => b.onclick = () => editShooting(b.dataset.editShooting));
    document.querySelectorAll('[data-delete-shooting]').forEach(b => b.onclick = () => deleteShooting(b.dataset.deleteShooting));
    refreshBell();
    renderCalendar();
  }

  function editShooting(id) {
    const s = shootings.find(x => String(x.id) === String(id));
    if (!s) return;
    currentShooting = id;
    [['sh-nom', s.nom], ['sh-type', s.type_shooting || 'concours'], ['sh-ecurie', s.ecurie_id], ['sh-cavaliere', s.cavaliere_id || ''], ['sh-debut', s.date_debut], ['sh-fin', s.date_fin], ['sh-heure-debut', s.heure_debut], ['sh-heure-fin', s.heure_fin], ['sh-distance', s.distance_km], ['sh-notes', s.notes]].forEach(([key, value]) => { if ($(key)) $(key).value = value || ''; });
    if ($('sh-rappel')) $('sh-rappel').checked = s.rappel_actif !== false;
    if ($('sh-submit-btn')) $('sh-submit-btn').textContent = 'Enregistrer';
    if ($('sh-annuler')) $('sh-annuler').style.display = 'inline-block';
    openTab('shootings');
  }

  $('sh-annuler')?.addEventListener('click', () => { currentShooting = null; $('form-shooting')?.reset(); if ($('sh-submit-btn')) $('sh-submit-btn').textContent = 'Ajouter'; $('sh-annuler').style.display = 'none'; });

  async function deleteShooting(id) {
    if (!confirm('Supprimer ce shooting ?')) return;
    const { error } = await db.from('concours').delete().eq('id', id);
    if (error) return alert(error.message);
    loadShootings();
  }

  $('form-shooting')?.addEventListener('submit', async e => {
    e.preventDefault();
    const ec = ecuries.find(x => String(x.id) === String($('sh-ecurie')?.value));
    const p = { nom: $('sh-nom').value, type_shooting: $('sh-type').value, ecurie_id: $('sh-ecurie')?.value || null, cavaliere_id: $('sh-cavaliere')?.value || null, date_debut: $('sh-debut').value, date_fin: $('sh-fin')?.value || $('sh-debut').value, heure_debut: $('sh-heure-debut')?.value || null, heure_fin: $('sh-heure-fin')?.value || null, distance_km: $('sh-distance')?.value || null, notes: $('sh-notes')?.value || null, rappel_actif: $('sh-rappel')?.checked ?? true, lieu: ec?.nom || null };
    const result = currentShooting ? await db.from('concours').update(p).eq('id', currentShooting) : await db.from('concours').insert(p);
    if (result.error) return alert(result.error.message);
    $('sh-annuler')?.click();
    loadShootings();
  });

  async function loadServices() {
    const { data, error } = await db.from('prestations').select('*').eq('actif', true).order('prix');
    if (error) return console.error(error);
    const services = data || [];
    if ($('table-prestations')) $('table-prestations').querySelector('tbody').innerHTML = services.map(s => `<tr><td>${safe(s.libelle)}</td><td>${safe(s.type)}</td><td>${safe(s.quantite || '-')}</td><td>${euro(s.prix)}</td><td><button class="btn-danger" data-delete-service="${s.id}">Supprimer</button></td></tr>`).join('');
    document.querySelectorAll('[data-delete-service]').forEach(b => b.onclick = async () => { if (!confirm('Supprimer cette prestation ?')) return; const { error } = await db.from('prestations').update({ actif: false }).eq('id', b.dataset.deleteService); if (error) return alert(error.message); loadServices(); });
    document.querySelectorAll('.ligne-prestation').forEach(select => { const value = select.value; select.innerHTML = '<option value="">-- Prestation --</option>' + services.map(s => `<option value="${s.id}" data-prix="${s.prix}">${safe(s.libelle)} - ${euro(s.prix)}</option>`).join(''); select.value = value; });
  }

  $('form-prestation')?.addEventListener('submit', async e => {
    e.preventDefault();
    const { error } = await db.from('prestations').insert({ libelle: $('pr-libelle').value, type: $('pr-type').value, quantite: $('pr-quantite')?.value || null, prix: $('pr-prix').value });
    if (error) return alert(error.message);
    e.target.reset();
    loadServices();
  });

  function calculate() {
    let total = 0;
    document.querySelectorAll('.ligne-facture').forEach(line => {
      const price = Number(line.querySelector('.ligne-prestation')?.selectedOptions[0]?.dataset.prix || 0);
      const quantity = Number(line.querySelector('.ligne-qte')?.value || 1);
      const subtotal = price * quantity;
      line.querySelector('.ligne-total').textContent = euro(subtotal);
      total += subtotal;
    });
    const km = $('fa-deplacement')?.checked ? Number($('fa-km')?.value || 0) : 0;
    const travel = km * Number(settings.taux_km || 0);
    if ($('fa-montant-deplacement')) $('fa-montant-deplacement').textContent = euro(travel);
    if ($('fa-total')) $('fa-total').textContent = euro(total + travel);
  }

  function bindLines() {
    document.querySelectorAll('.ligne-prestation, .ligne-qte').forEach(x => { x.onchange = calculate; x.oninput = calculate; });
  }

  $('ajouter-ligne')?.addEventListener('click', () => {
    const line = document.createElement('div');
    line.className = 'ligne-facture';
    line.innerHTML = '<select class="ligne-prestation"></select><input class="ligne-qte" type="number" value="1" min="1"><span class="ligne-total">0.00 EUR</span><button type="button" class="btn-danger">-</button>';
    line.querySelector('button').onclick = () => { line.remove(); calculate(); };
    $('lignes-container')?.appendChild(line);
    loadServices().then(bindLines);
  });

  $('fa-deplacement')?.addEventListener('change', () => { if ($('fa-km')) $('fa-km').disabled = !$('fa-deplacement').checked; calculate(); });
  $('fa-km')?.addEventListener('input', calculate);
  $('fa-shooting')?.addEventListener('change', () => { const km = $('fa-shooting').selectedOptions[0]?.dataset.distance || 0; if (km) { $('fa-km').value = km; $('fa-deplacement').checked = true; $('fa-km').disabled = false; calculate(); } });

  $('form-facture')?.addEventListener('submit', async e => {
    e.preventDefault();
    const riderId = $('fa-cavaliere')?.value;
    if (!riderId) return alert('Selectionne un(e) cavalier(e).');
    const lines = [];
    document.querySelectorAll('.ligne-facture').forEach(line => {
      const option = line.querySelector('.ligne-prestation')?.selectedOptions[0];
      if (option?.value) {
        const quantity = Number(line.querySelector('.ligne-qte').value || 1);
        const price = Number(option.dataset.prix || 0);
        lines.push({ prestation_id: option.value, libelle: option.textContent.split(' - ')[0], quantite: quantity, prix_unitaire: price, sous_total: price * quantity });
      }
    });
    if (!lines.length) return alert('Ajoute une prestation.');
    const km = $('fa-deplacement')?.checked ? Number($('fa-km')?.value || 0) : 0;
    const travel = km * Number(settings.taux_km || 0);
    const total = lines.reduce((sum, line) => sum + Number(line.sous_total), 0) + travel;
    const number = `${settings.prefixe_facture}${String(settings.prochain_numero_facture).padStart(3, '0')}`;
    const invoice = await db.from('factures').insert({ numero: number, date_facture: $('fa-date').value, cavaliere_id: riderId, concours_id: $('fa-shooting')?.value || null, lieu: $('fa-lieu')?.value || null, deplacement_km: km, montant_deplacement: travel, montant_total: total, mention_tva: settings.mention_tva, type_paiement: $('fa-paiement')?.value || null }).select().single();
    if (invoice.error) return alert(invoice.error.message);
    const details = await db.from('lignes_facture').insert(lines.map(line => ({ ...line, facture_id: invoice.data.id })));
    if (details.error) return alert(details.error.message);
    await db.from('reglages').update({ prochain_numero_facture: Number(settings.prochain_numero_facture) + 1 }).eq('id', settings.id);
    settings.prochain_numero_facture = Number(settings.prochain_numero_facture) + 1;
    e.target.reset();
    if ($('fa-date')) $('fa-date').value = dateNow();
    if ($('fa-km')) $('fa-km').disabled = true;
    calculate();
    loadInvoices();
    loadDashboard();
    refreshUnpaid();
  });

  async function loadInvoices() {
    let q = db.from('factures').select('*,cavalieres(nom,prenom),lignes_facture(libelle,quantite,sous_total)').order('date_facture', { ascending: false });
    const d1 = $('filtre-date-debut')?.value;
    const d2 = $('filtre-date-fin')?.value;
    const status = $('filtre-statut')?.value;
    const payment = $('filtre-paiement')?.value;
    if (d1) q = q.gte('date_facture', d1);
    if (d2) q = q.lte('date_facture', d2);
    if (status) q = q.eq('statut_paiement', status);
    if (payment) q = q.eq('type_paiement', payment);
    const { data, error } = await q;
    if (error) return console.error(error);
    const invoices = data || [];
    const total = invoices.reduce((sum, invoice) => sum + Number(invoice.montant_total || 0), 0);
    if ($('factures-total-global')) $('factures-total-global').textContent = euro(total);
    if ($('factures-total-periode')) $('factures-total-periode').textContent = euro(total);
    if ($('factures-total-periode-label')) $('factures-total-periode-label').textContent = d1 || d2 ? 'Total periode' : 'Total filtre actif';
    if ($('table-factures')) $('table-factures').querySelector('tbody').innerHTML = invoices.length ? invoices.map(invoice => {
      const lines = invoice.lignes_facture || [];
      const resume = lines.length ? lines.map(l => `${l.libelle} (x${l.quantite})`).join(', ') : 'Aucune prestation';
      const tooltip = lines.map(l => `<div>${safe(l.libelle)} x ${l.quantite} - ${euro(l.sous_total)}</div>`).join('');
      return `<tr data-invoice-id="${invoice.id}"><td>${safe(invoice.numero)}</td><td>${safe(invoice.date_facture)}</td><td>${safe(invoice.cavalieres?.prenom)} ${safe(invoice.cavalieres?.nom)}</td><td><span class="presta-resume">${safe(resume)}${lines.length > 1 ? ' (plus)' : ''}<span class="presta-tooltip"><b>Prestations</b>${tooltip}</span></span></td><td>${euro(invoice.montant_total)}</td><td><select data-pay="${invoice.id}"><option value="">-</option>${(settings.types_paiement || []).map(x => `<option value="${x}" ${invoice.type_paiement === x ? 'selected' : ''}>${paymentLabel(x)}</option>`).join('')}</select></td><td><select data-status="${invoice.id}"><option value="en_attente" ${invoice.statut_paiement === 'en_attente' ? 'selected' : ''}>En attente</option><option value="payee" ${invoice.statut_paiement === 'payee' ? 'selected' : ''}>Payee</option><option value="en_retard" ${invoice.statut_paiement === 'en_retard' ? 'selected' : ''}>En retard</option></select></td><td><button class="btn-muted" data-view-invoice="${invoice.id}">Voir</button><button class="btn-danger" data-delete-invoice="${invoice.id}">Supprimer</button></td></tr>`;
    }).join('') : '<tr><td colspan="8">Aucune facture</td></tr>';
    document.querySelectorAll('[data-status]').forEach(x => x.onchange = async () => { const { error } = await db.from('factures').update({ statut_paiement: x.value }).eq('id', x.dataset.status); if (error) return alert(error.message); loadInvoices(); loadDashboard(); refreshUnpaid(); });
    document.querySelectorAll('[data-pay]').forEach(x => x.onchange = async () => { const { error } = await db.from('factures').update({ type_paiement: x.value || null }).eq('id', x.dataset.pay); if (error) return alert(error.message); loadInvoices(); });
    document.querySelectorAll('[data-delete-invoice]').forEach(x => x.onclick = async () => { if (!confirm('Supprimer cette facture ?')) return; const { error } = await db.from('factures').delete().eq('id', x.dataset.deleteInvoice); if (error) return alert(error.message); loadInvoices(); loadDashboard(); refreshUnpaid(); });
    document.querySelectorAll('[data-view-invoice]').forEach(x => x.onclick = () => {
      const invoice = invoices.find(i => String(i.id) === String(x.dataset.viewInvoice));
      if (!invoice) return;
      const lines = invoice.lignes_facture || [];
      if ($('facture-modal-titre')) $('facture-modal-titre').textContent = `Facture ${invoice.numero}`;
      if ($('facture-modal-contenu')) $('facture-modal-contenu').innerHTML = `<div class="invoice-detail-list"><div class="invoice-detail-line"><span>Date</span><strong>${safe(invoice.date_facture)}</strong></div><div class="invoice-detail-line"><span>Cavalier(e)</span><strong>${safe(invoice.cavalieres?.prenom)} ${safe(invoice.cavalieres?.nom)}</strong></div><div class="invoice-detail-line"><span>Paiement</span><strong>${paymentLabel(invoice.type_paiement) || '-'}</strong></div>${lines.map(l => `<div class="invoice-detail-line"><span>${safe(l.libelle)} x ${l.quantite}</span><span>${euro(l.sous_total)}</span></div>`).join('')}<div class="invoice-detail-total"><strong>Total : ${euro(invoice.montant_total)}</strong></div></div>`;
      $('modal-facture')?.classList.add('visible');
    });
  }

  ['filtre-date-debut', 'filtre-date-fin', 'filtre-statut', 'filtre-paiement'].forEach(id => $(id)?.addEventListener('change', loadInvoices));
  $('reinit-filtre-factures')?.addEventListener('click', () => { ['filtre-date-debut', 'filtre-date-fin', 'filtre-statut', 'filtre-paiement'].forEach(id => { if ($(id)) $(id).value = ''; }); loadInvoices(); });

  function renderCalendar() {
    if (!$('calendar-grid')) return;
    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();
    if ($('calendar-title')) $('calendar-title').textContent = calCursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if ($('calendar-head')) $('calendar-head').innerHTML = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => `<div>${d}</div>`).join('');
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const last = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= last; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7) cells.push(null);
    const showConcours = $('filter-concours')?.checked !== false;
    const showCustom = $('filter-personnalise')?.checked !== false;
    $('calendar-grid').innerHTML = cells.map(date => {
      if (!date) return '<div class="fc-day out"></div>';
      const iso = date.toISOString().slice(0, 10);
      const events = shootings.filter(s => iso >= s.date_debut && iso <= (s.date_fin || s.date_debut) && (s.type_shooting === 'concours' ? showConcours : showCustom));
      return `<div class="fc-day ${iso === dateNow() ? 'today' : ''}" data-date="${iso}"><span class="fc-day-number">${date.getDate()}</span>${events.map(e => { const place = e.ecuries?.nom || e.lieu || 'Lieu inconnu'; const rider = e.cavalieres ? `${e.cavalieres.prenom} ${e.cavalieres.nom}` : '-'; const detail = e.type_shooting === 'concours' ? `<b>${safe(e.nom)}</b><br><small>Lieu : ${safe(place)}</small>` : `<b>${safe(e.nom)}</b><br><small>Lieu : ${safe(place)}</small><br><small>Cavalier(e) : ${safe(rider)}</small>`; return `<span class="fc-event ${safe(e.type_shooting)}" data-event-id="${e.id}">${safe(e.nom)}<span class="fc-event-tooltip">${detail}</span></span>`; }).join('')}</div>`;
    }).join('');
    document.querySelectorAll('[data-event-id]').forEach(e => e.onclick = event => { event.stopPropagation(); editShooting(e.dataset.eventId); });
    document.querySelectorAll('.fc-day[data-date]').forEach(day => day.onclick = () => { if ($('sh-debut')) $('sh-debut').value = day.dataset.date; if ($('sh-fin')) $('sh-fin').value = day.dataset.date; openTab('shootings'); });
  }

  $('calendar-prev')?.addEventListener('click', () => { calCursor.setMonth(calCursor.getMonth() - 1); renderCalendar(); });
  $('calendar-next')?.addEventListener('click', () => { calCursor.setMonth(calCursor.getMonth() + 1); renderCalendar(); });
  $('calendar-today')?.addEventListener('click', () => { calCursor = new Date(); renderCalendar(); });
  $('filter-concours')?.addEventListener('change', renderCalendar);
  $('filter-personnalise')?.addEventListener('change', renderCalendar);
  $('calendar-create')?.addEventListener('click', () => { if ($('sh-debut')) $('sh-debut').value = dateNow(); if ($('sh-fin')) $('sh-fin').value = dateNow(); openTab('shootings'); });

  function reminderItems() {
    const now = new Date(`${dateNow()}T00:00:00`);
    return shootings.filter(s => s.rappel_actif !== false).map(s => {
      const eventDate = new Date(`${s.date_debut}T00:00:00`);
      const days = Math.ceil((eventDate - now) / 86400000);
      return { id: s.id, shooting: s, days, label: days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days} jours` };
    }).filter(item => item.days >= 0 && (settings.rappels_jours || [7]).some(days => days >= item.days)).sort((a, b) => a.days - b.days);
  }

  function bellItemHTML(item) {
    const s = item.shooting;
    return `<div class="bell-item" data-bell-shooting-id="${item.id}"><span class="bell-icon-dot ${safe(s.type_shooting)}"><i class="bx ${s.type_shooting === 'concours' ? 'bx-trophy' : 'bx-camera-movie'}"></i></span><div class="bell-item-body"><span class="bell-when">${item.label}</span><strong>${safe(s.nom)}</strong><span class="bell-type">${s.type_shooting === 'concours' ? 'Concours' : 'Shooting personnalise'} - ${safe(s.date_debut)}</span></div></div>`;
  }

  function refreshBell() {
    bellItemsCache = reminderItems();
    const limit = settings.rappel_affichage_limite || 3;
    if ($('bell-badge')) { $('bell-badge').textContent = bellItemsCache.length; $('bell-badge').classList.toggle('hidden', !bellItemsCache.length); }
    if ($('bell-count-pill')) $('bell-count-pill').textContent = `${bellItemsCache.length} notification${bellItemsCache.length === 1 ? '' : 's'}`;
    if ($('bell-list')) $('bell-list').innerHTML = bellItemsCache.length ? bellItemsCache.slice(0, limit).map(bellItemHTML).join('') : '<p class="aide" style="padding:16px">Aucun rappel.</p>';
    document.querySelectorAll('[data-bell-shooting-id]').forEach(x => x.onclick = () => { openTab('shootings'); setTimeout(() => { const row = document.querySelector(`[data-shooting-id="${x.dataset.bellShootingId}"]`); row?.classList.add('row-highlight'); row?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => row?.classList.remove('row-highlight'), 3000); }, 100); });
    if ($('bell-footer')) $('bell-footer').style.display = bellItemsCache.length > limit ? 'block' : 'none';
    if ($('bell-voir-plus') && bellItemsCache.length > limit) $('bell-voir-plus').textContent = `Voir plus (${bellItemsCache.length - limit})`;
  }

  async function refreshUnpaid() {
    const { data, error } = await db.from('factures').select('id,numero,montant_total,statut_paiement,cavalieres(prenom,nom)').in('statut_paiement', ['en_attente', 'en_retard']).order('date_facture');
    if (error) return console.error(error);
    unpaidItems = data || [];
    if ($('unpaid-badge')) { $('unpaid-badge').textContent = unpaidItems.length; $('unpaid-badge').classList.toggle('hidden', !unpaidItems.length); }
    if ($('unpaid-count-pill')) $('unpaid-count-pill').textContent = unpaidItems.length;
    if ($('unpaid-list')) $('unpaid-list').innerHTML = unpaidItems.length ? unpaidItems.slice(0, 10).map(f => `<div class="bell-item unpaid-item" data-unpaid-id="${f.id}"><span class="bell-icon-dot" style="background:var(--warning)"><i class="bx bx-wallet"></i></span><div class="bell-item-body"><span class="bell-when">Paiement attendu</span><strong>${safe(f.numero)}</strong><span class="bell-type">${safe(f.cavalieres?.prenom)} ${safe(f.cavalieres?.nom)} - ${euro(f.montant_total)}</span></div></div>`).join('') : '<p class="aide" style="padding:16px">Aucune facture non payee.</p>';
    document.querySelectorAll('[data-unpaid-id]').forEach(x => x.onclick = () => { openTab('factures'); setTimeout(() => { const row = document.querySelector(`[data-invoice-id="${x.dataset.unpaidId}"]`); row?.classList.add('row-highlight'); row?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => row?.classList.remove('row-highlight'), 3000); }, 100); });
  }

  $('bell-voir-plus')?.addEventListener('click', () => { if ($('notifs-full-list')) $('notifs-full-list').innerHTML = bellItemsCache.map(bellItemHTML).join('') || '<p class="aide">Aucun rappel.</p>'; $('bell-menu')?.classList.remove('open'); $('modal-notifs')?.classList.add('visible'); });

  async function loadDashboard() {
    try {
      const [ridersResult, stablesResult, invoicesResult, shootingsResult] = await Promise.all([db.from('cavalieres').select('id'), db.from('ecuries').select('id'), db.from('factures').select('*,cavalieres(nom,prenom)'), db.from('concours').select('*').order('date_debut')]);
      const riders = ridersResult.data || [], stables = stablesResult.data || [], invoices = invoicesResult.data || [], shootingData = shootingsResult.data || [];
      if ($('stat-cavalieres')) $('stat-cavalieres').textContent = riders.length;
      if ($('stat-ecuries')) $('stat-ecuries').textContent = stables.length;
      const now = new Date();
      const paid = invoices.filter(i => i.statut_paiement === 'payee');
      const monthRevenue = paid.filter(i => { const d = new Date(`${i.date_facture}T12:00:00`); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, i) => sum + Number(i.montant_total || 0), 0);
      if ($('stat-ca-mois')) $('stat-ca-mois').textContent = euro(monthRevenue);
      if ($('stat-en-attente')) $('stat-en-attente').textContent = invoices.filter(i => ['en_attente', 'en_retard'].includes(i.statut_paiement)).length;
      const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const labels = [], values = [];
      for (let offset = 5; offset >= 0; offset--) { const md = new Date(now.getFullYear(), now.getMonth() - offset, 1); labels.push(names[md.getMonth()]); values.push(paid.filter(i => { const d = new Date(`${i.date_facture}T12:00:00`); return d.getMonth() === md.getMonth() && d.getFullYear() === md.getFullYear(); }).reduce((sum, i) => sum + Number(i.montant_total || 0), 0)); }
      if (chart) { chart.destroy(); chart = null; }
      const canvas = $('chart-ca');
      if (window.Chart && canvas) chart = new Chart(canvas, { type: 'bar', data: { labels, datasets: [{ label: 'CA encaissé', data: values, backgroundColor: getComputedStyle(root).getPropertyValue('--accent').trim() || '#556EE6', borderRadius: 5, borderSkipped: false }] }, options: { responsive: true, maintainAspectRatio: true, aspectRatio: 3.2, animation: { duration: 800, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `CA encaissé : ${euro(c.raw)}` } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: value => euro(value) } } } } });
      if ($('liste-prochains-shootings')) $('liste-prochains-shootings').innerHTML = shootingData.filter(s => s.date_debut >= dateNow()).slice(0, 5).map(s => `<li><span>${safe(s.nom)}</span><span class="badge-date">${safe(s.date_debut)}</span></li>`).join('') || '<li>Aucun shooting a venir</li>';
      if ($('liste-dernieres-factures')) $('liste-dernieres-factures').innerHTML = [...invoices].sort((a, b) => new Date(`${b.date_facture}T12:00:00`) - new Date(`${a.date_facture}T12:00:00`)).slice(0, 5).map(i => `<tr><td>${safe(i.numero || '-')}</td><td>${safe(i.cavalieres?.prenom || '-')} ${safe(i.cavalieres?.nom || '')}</td><td>${safe(i.date_facture || '-')}</td><td>${euro(i.montant_total)}</td><td><span class="badge-statut badge-${safe(i.statut_paiement || 'en_attente')}">${safe(i.statut_paiement || 'en_attente')}</span></td></tr>`).join('') || '<tr><td colspan="5">Aucune facture</td></tr>';
    } catch (error) { console.error('Erreur de chargement du tableau de bord :', error); }
  }

  async function init() {
    setTheme(localStorage.getItem('theme') || 'light');
    setLayout(localStorage.getItem('layout') || 'vertical');
    setSidebar(localStorage.getItem('sidebar') || 'normal');
    setColorTheme(localStorage.getItem('colorTheme') || 'classic');
    loadLocalProfile();
    initIconFields();
    applyIcons();
    renderThemeColorFields();
    if ($('fa-date')) $('fa-date').value = dateNow();
    await loadSettings();
    await loadStables();
    await loadRiders();
    await loadShootings();
    await loadServices();
    await loadInvoices();
    bindLines();
    calculate();
    await loadDashboard();
    await refreshUnpaid();
    renderCalendar();
  }

  init();
});
