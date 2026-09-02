document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const state = { db: null, ecuries: [], cavalieres: [], concours: [], prestations: [], factures: [], lignes: [], reglages: null };
  const titles = { dashboard:'Tableau de bord', ecuries:'Écuries', cavalieres:'Cavalières', concours:'Concours', prestations:'Grille tarifaire', facturation:'Créer une facture', factures:'Factures émises', reglages:'Réglages' };

  function setStatus(kind, message) {
    const box = $('connection-status');
    if (!box) return;
    box.className = `connection-status ${kind}`;
    const icon = kind === 'ok' ? 'bx-check-circle' : kind === 'error' ? 'bx-error-circle' : 'bx-loader-alt bx-spin';
    box.innerHTML = `<i class="bx ${icon}"></i><span>${message}</span>`;
  }

  function text(id, value) { const el = $(id); if (el) el.textContent = value ?? ''; }
  function val(id) { const el = $(id); return el ? el.value.trim() : ''; }
  function euro(value) { return `${Number(value || 0).toFixed(2).replace('.', ',')} €`; }
  function esc(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function errorMessage(error) { return error?.message || error?.details || error?.hint || 'Erreur inconnue'; }

  function closeUserMenu() { $('user-menu')?.classList.remove('open'); }

  document.querySelectorAll('#tabs button[data-tab]').forEach(button =>
    button.addEventListener('click', () => {
      document.querySelectorAll('#tabs button[data-tab]').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      $(button.dataset.tab)?.classList.add('active');
      text('page-title', titles[button.dataset.tab] || 'ShootnLook');
      document.body.classList.remove('menu-open');
      closeUserMenu();
    })
  );

  $('sidebar-toggle')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $('sidebar-backdrop')?.addEventListener('click', () => document.body.classList.remove('menu-open'));
  $('user-toggle')?.addEventListener('click', event => { event.stopPropagation(); $('user-menu')?.classList.toggle('open'); });
  document.addEventListener('click', event => { if (!event.target.closest('.topbar-menu-wrap')) closeUserMenu(); });

  $('edit-profile-btn')?.addEventListener('click', () => { closeUserMenu(); $('profile-modal')?.classList.add('visible'); });
  $('open-profile-modal')?.addEventListener('click', () => $('profile-modal')?.classList.add('visible'));
  $('close-profile-modal')?.addEventListener('click', () => $('profile-modal')?.classList.remove('visible'));
  document.querySelectorAll('[data-open-tab]').forEach(button =>
    button.addEventListener('click', () => document.querySelector(`#tabs button[data-tab="${button.dataset.openTab}"]`)?.click())
  );

  function loadLocalProfile() {
    const name = localStorage.getItem('profil_pseudo') || 'Admin';
    ['dashboard-user-name','menu-user-name'].forEach(id => text(id, name));
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = name.charAt(0).toUpperCase());
    ['pf-pseudo','pf-societe','pf-adresse','pf-code-postal','pf-ville'].forEach(id => {
      const el = $(id);
      if (el) el.value = localStorage.getItem(`profil_${id.replace('pf-','')}`) || '';
    });
  }

  $('form-profil')?.addEventListener('submit', event => {
    event.preventDefault();
    const fields = {
      pseudo: $('pf-pseudo').value.trim() || 'Admin',
      societe: $('pf-societe').value.trim(),
      adresse: $('pf-adresse').value.trim(),
      code_postal: $('pf-code-postal').value.trim(),
      ville: $('pf-ville').value.trim()
    };
    Object.entries(fields).forEach(([key, value]) => localStorage.setItem(`profil_${key}`, value));
    loadLocalProfile();
    $('profile-modal')?.classList.remove('visible');
  });

  async function selectAll(table, order) {
    let query = state.db.from(table).select('*');
    if (order) query = query.order(order);
    const { data, error } = await query;
    if (error) throw new Error(`${table} : ${errorMessage(error)}`);
    return data || [];
  }

  async function loadData() {
    setStatus('loading', 'Connexion à la base de données…');
    if (!window.supabase || typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined')
      throw new Error('Supabase ou config.js n\'est pas chargé.');

    state.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const results = await Promise.all([
      selectAll('reglages', null),
      selectAll('ecuries', 'nom'),
      selectAll('cavalieres', 'nom'),
      selectAll('concours', 'date_debut'),
      selectAll('prestations', 'libelle'),
      selectAll('factures', 'date_creation')
    ]);

    [state.reglages, state.ecuries, state.cavalieres, state.concours, state.prestations, state.factures] = results;
    state.reglages = state.reglages[0] || null;

    const paid = state.factures.filter(f => String(f.statut_paiement || f.statut || '').toLowerCase() === 'payee');
    const pending = state.factures.filter(f => ['en_attente','en_retard','pending'].includes(String(f.statut_paiement || f.statut || '').toLowerCase()));
    const now = new Date();
    const monthly = paid.filter(f => {
      const d = new Date(f.date_creation || f.date || f.created_at);
      return !Number.isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, f) => sum + Number(f.montant_total || f.montant || 0), 0);

    text('dash-total-ecuries', state.ecuries.length);
    text('dash-total-cavalieres', state.cavalieres.length);
    text('dash-en-attente', pending.length);
    text('dash-ca-mois', euro(monthly));
    text('ecuries-summary', `${state.ecuries.length} écurie(s) chargée(s) depuis Supabase.`);
    text('cavalieres-summary', `${state.cavalieres.length} cavalière(s) chargée(s) depuis Supabase.`);
    text('concours-summary', `${state.concours.length} concours chargé(s) depuis Supabase.`);
    text('prestations-summary', `${state.prestations.length} prestation(s) chargée(s) depuis Supabase.`);
    text('factures-summary', `${state.factures.length} facture(s) chargée(s) depuis Supabase.`);
    text('sync-summary', `Connexion réussie : ${state.ecuries.length} écurie(s), ${state.cavalieres.length} cavalière(s), ${state.concours.length} concours, ${state.prestations.length} prestation(s) et ${state.factures.length} facture(s).`);

    setStatus('ok', 'Connexion Supabase établie. Les données sont synchronisées.');
  }

  function renderEcuries() {
    const panel = $('ecuries')?.querySelector('.panel');
    if (!panel) return;
    if (!state.ecuries.length) { panel.innerHTML = '<p>Aucune écurie pour le moment.</p>'; return; }
    panel.innerHTML = state.ecuries.map(e => `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>${esc(e.nom)}</strong><br>${e.adresse ? esc(e.adresse) + '<br>' : ''}${e.code_postal || e.ville ? esc([e.code_postal, e.ville].filter(Boolean).join(' ')) + '<br>' : ''}${e.contact_nom ? 'Contact : ' + esc(e.contact_nom) + '<br>' : ''}${e.notes ? '<small>' + esc(e.notes) + '</small>' : ''}</div>`).join('');
  }

  function renderCavalieres() {
    const panel = $('cavalieres')?.querySelector('.panel');
    if (!panel) return;
    if (!state.cavalieres.length) { panel.innerHTML = '<p>Aucune cavalière pour le moment.</p>'; return; }
    const getEcurieName = id => { const e = state.ecuries.find(x => x.id === id); return e ? e.nom : '—'; };
    panel.innerHTML = state.cavalieres.map(c => `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>${esc(c.prenom)} ${esc(c.nom)}</strong><br>Écurie : ${esc(getEcurieName(c.ecurie_id))}<br>${c.nom_cheval ? 'Cheval : ' + esc(c.nom_cheval) + '<br>' : ''}${c.telephone ? 'Tél : ' + esc(c.telephone) + '<br>' : ''}${c.email ? 'Email : ' + esc(c.email) + '<br>' : ''}<small>Statut : ${esc(c.statut || 'prospect')}</small></div>`).join('');
  }

  function renderConcours() {
    const panel = $('concours')?.querySelector('.panel');
    if (!panel) return;
    if (!state.concours.length) { panel.innerHTML = '<p>Aucun concours pour le moment.</p>'; return; }
    const getEcurieName = id => { const e = state.ecuries.find(x => x.id === id); return e ? e.nom : '—'; };
    panel.innerHTML = state.concours.map(c => `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>${esc(c.nom)}</strong><br>${c.lieu ? 'Lieu : ' + esc(c.lieu) + '<br>' : ''}${c.date_debut ? 'Du : ' + esc(c.date_debut) + '<br>' : ''}${c.date_fin ? 'Au : ' + esc(c.date_fin) + '<br>' : ''}${c.distance_km ? 'Distance : ' + esc(c.distance_km) + ' km<br>' : ''}<small>Écurie : ${esc(getEcurieName(c.ecurie_id))}</small>${c.notes ? '<br><small>' + esc(c.notes) + '</small>' : ''}</div>`).join('');
  }

  function renderPrestations() {
    const section = $('prestations');
    if (!section) return;
    let panel = section.querySelector('.panel');
    if (!panel) { panel = document.createElement('section'); panel.className = 'panel'; section.appendChild(panel); }
    if (!state.prestations.length) { panel.innerHTML = '<p>Aucune prestation pour le moment.</p>'; return; }
    panel.innerHTML = state.prestations.map(p => `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>${esc(p.libelle)}</strong><br>Type : ${esc(p.type)}<br>Quantité : ${p.quantite ?? '—'}<br>Prix : ${euro(p.prix)}</div>`).join('');
  }

  function renderFactures() {
    const panel = $('factures')?.querySelector('.panel');
    if (!panel) return;
    if (!state.factures.length) { panel.innerHTML = '<p>Aucune facture pour le moment.</p>'; return; }
    const getCavaliereName = id => { const c = state.cavalieres.find(x => x.id === id); return c ? c.prenom + ' ' + c.nom : '—'; };
    panel.innerHTML = state.factures.map(f => {
      const statut = f.statut_paiement || f.statut || 'en_attente';
      const badgeClass = statut === 'payee' ? 'success' : statut === 'en_retard' ? 'danger' : 'warning';
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>${esc(f.numero)}</strong> – ${esc(f.date_facture || f.date_creation || '—')}<br>Cavalière : ${esc(getCavaliereName(f.cavaliere_id))}<br>Montant : ${euro(f.montant_total)}<br><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:var(--${badgeClass}-bg);color:var(--${badgeClass})">${esc(statut)}</span></div>`;
    }).join('');
  }

  function renderReglages() {
    const section = $('reglages');
    if (!section) return;
    let panel = section.querySelector('.panel');
    if (!panel) { panel = document.createElement('section'); panel.className = 'panel'; section.appendChild(panel); }
    const r = state.reglages;
    if (!r) { panel.innerHTML = '<p>Aucun réglage pour le moment.</p>'; return; }
    panel.innerHTML = `<div style="border:1px solid var(--border);border-radius:8px;padding:16px;background:var(--bg-card);box-shadow:var(--shadow)"><strong>Entreprise</strong><br>${r.nom_entreprise ? esc(r.nom_entreprise) + '<br>' : ''}${r.adresse ? esc(r.adresse) + '<br>' : ''}${[r.code_postal_entreprise, r.ville_entreprise].filter(Boolean).length ? esc([r.code_postal_entreprise, r.ville_entreprise].filter(Boolean).join(' ')) + '<br>' : ''}${r.siret ? 'SIRET : ' + esc(r.siret) + '<br>' : ''}${r.mention_tva ? '<small>' + esc(r.mention_tva) + '</small><br>' : ''}<br><strong>Facturation</strong><br>Préfixe : ${esc(r.prefixe_facture || '—')}<br>Prochain numéro : ${r.prochain_numero_facture ?? '—'}<br>Taux km : ${euro(r.taux_km || 0)} / km<br>${r.puissance_fiscale_cv ? 'Puissance fiscale : ' + r.puissance_fiscale_cv + ' CV<br>' : ''}</div>`;
  }

  function renderFacturation() {
    const section = $('facturation');
    if (!section) return;
    let panel = section.querySelector('.panel');
    if (!panel) { panel = document.createElement('section'); panel.className = 'panel'; section.appendChild(panel); }
    if (!state.cavalieres.length || !state.prestations.length) { panel.innerHTML = '<p>Ajoute d\'abord des cavalières et des prestations pour créer une facture.</p>'; return; }
    const cavOptions = state.cavalieres.map(c => '<option value="' + c.id + '">' + esc(c.prenom) + ' ' + esc(c.nom) + '</option>').join('');
    const prestOptions = state.prestations.map(p => '<option value="' + p.id + '" data-prix="' + p.prix + '">' + esc(p.libelle) + ' – ' + euro(p.prix) + '</option>').join('');

    panel.innerHTML = '<form id="form-facture" style="display:flex;flex-direction:column;gap:12px;max-width:500px"><label>Cavalière<select id="ff-cavaliere" required>' + cavOptions + '</select></label><label>Prestation<select id="ff-prestation" required>' + prestOptions + '</select></label><label>Quantité<input type="number" id="ff-quantite" value="1" min="1" required></label><button type="submit" class="btn-primary"><i class="bx bx-plus"></i> Créer la facture</button></form><div id="ff-result" style="margin-top:12px"></div>';

    $('form-facture')?.addEventListener('submit', async event => {
      event.preventDefault();
      const resultBox = $('ff-result');
      if (!resultBox) return;
      resultBox.innerHTML = '<p>Création de la facture…</p>';

      const cavaliere_id = Number($('ff-cavaliere').value);
      const prestation_id = Number($('ff-prestation').value);
      const quantite = Number($('ff-quantite').value);

      const prestation = state.prestations.find(p => p.id === prestation_id);
      if (!prestation) { resultBox.innerHTML = '<p style="color:var(--danger)">Prestation introuvable.</p>'; return; }

      const montant = Number(prestation.prix) * quantite;
      const r = state.reglages || {};
      const prefixe = r.prefixe_facture || 'FACT-';
      const numero = prefixe + String(r.prochain_numero_facture || 1).padStart(4, '0');

      try {
        const { data: facture, error: errFact } = await state.db.from('factures').insert({ numero, cavaliere_id, montant_total: montant, statut_paiement: 'en_attente', mention_tva: r.mention_tva || 'TVA non applicable, art. 293 B du CGI' }).select().single();
        if (errFact) throw errFact;

        const { error: errLigne } = await state.db.from('lignes_facture').insert({ facture_id: facture.id, prestation_id, libelle: prestation.libelle, quantite, prix_unitaire: prestation.prix, sous_total: montant });
        if (errLigne) throw errLigne;

        if (r.id) {
          await state.db.from('reglages').update({ prochain_numero_facture: (r.prochain_numero_facture || 1) + 1 }).eq('id', r.id);
        }

        resultBox.innerHTML = '<p style="color:var(--success)">Facture <strong>' + esc(numero) + '</strong> créée avec succès (montant : ' + euro(montant) + ').</p>';
        state.factures = await selectAll('factures', 'date_creation');
        renderFactures();
      } catch (error) {
        console.error(error);
        resultBox.innerHTML = '<p style="color:var(--danger)">Erreur : ' + esc(errorMessage(error)) + '</p>';
      }
    });
  }

  async function start() {
    loadLocalProfile();
    try {
      await loadData();
      renderEcuries();
      renderCavalieres();
      renderConcours();
      renderPrestations();
      renderFactures();
      renderFacturation();
      renderReglages();
    } catch (error) {
      console.error(error);
      setStatus('error', 'Connexion impossible : ' + error.message);
      text('sync-summary', 'Les données ne sont pas accessibles. Vérifie les politiques RLS et les noms des tables dans Supabase.');
      ['dash-total-ecuries','dash-total-cavalieres','dash-en-attente'].forEach(id => text(id, '—'));
      text('dash-ca-mois', '—');
    }
  }

  $('retry-connection')?.addEventListener('click', start);
  start();
});
