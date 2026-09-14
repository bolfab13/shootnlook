export const defaultSettings = {
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
  taux_km: 0.606,
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

export const loadSettings = async (db, get = id => document.getElementById(id)) => {
  const { data, error } = await db.from('reglages').select('*').limit(1).single();
  if (error) {
    const isMissingData = error.code === 'PGRST116' || error.code === '42P01' || error.code === '42501' || /No rows|0 rows|does not exist/i.test(error.message || '');
    if (isMissingData) return { ...defaultSettings };
    throw error;
  }
  if (!data) return { ...defaultSettings };

  const settings = {
    ...defaultSettings,
    ...data,
    rappels_jours: data.rappels_jours?.length ? data.rappels_jours : defaultSettings.rappels_jours,
    rappel_affichage_limite: data.rappel_affichage_limite || defaultSettings.rappel_affichage_limite,
    types_paiement: data.types_paiement?.length ? data.types_paiement : defaultSettings.types_paiement
  };

  const fields = {
    'rg-nom-entreprise': settings.nom_entreprise,
    'rg-adresse-entreprise': settings.adresse,
    'rg-code-postal-entreprise': settings.code_postal_entreprise,
    'rg-ville-entreprise': settings.ville_entreprise,
    'rg-siret': settings.siret,
    'rg-domicile-adresse': settings.domicile_adresse,
    'rg-domicile-lat': settings.domicile_latitude,
    'rg-domicile-lon': settings.domicile_longitude,
    'rg-cv': settings.puissance_fiscale_cv,
    'rg-taux': settings.taux_km,
    'rg-tva': settings.mention_tva,
    'rg-prefixe': settings.prefixe_facture,
    'rg-vehicule-marque': settings.vehicule_marque,
    'rg-vehicule-modele': settings.vehicule_modele,
    'rg-vehicule-annee': settings.vehicule_annee,
    'rg-vehicule-energie': settings.vehicule_energie,
    'rg-bell-limite': settings.rappel_affichage_limite
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = get(id);
    if (field) field.value = value ?? '';
  });

  document.querySelectorAll('.rg-rappel').forEach(input => {
    input.checked = settings.rappels_jours.includes(Number(input.value));
  });
  document.querySelectorAll('.rg-paiement').forEach(input => {
    input.checked = settings.types_paiement.includes(input.value);
  });

  const company = get('sidebar-company-name');
  if (company) company.textContent = settings.nom_entreprise.trim() || 'PHOTO EQUESTRE';

  return settings;
};
