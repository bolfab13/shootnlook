export function createPrestationsModule({ db, $, state, safe, euro, openTab }) {
  async function loadServices() {
    const { data, error } = await db
      .from('prestations')
      .select('*')
      .eq('actif', true)
      .order('prix');
    if (error) throw error;

    state.services = data || [];
    const table = $('table-prestations');
    if (table) {
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = state.services.map(service => `
          <tr>
            <td>${safe(service.libelle)}</td>
            <td>${safe(service.type || '')}</td>
            <td>${safe(service.quantite ?? '-')}</td>
            <td>${euro(service.prix)}</td>
            <td>
              <button type="button" data-edit-service="${service.id}">Modifier</button>
              <button type="button" class="btn-danger" data-delete-service="${service.id}">Supprimer</button>
            </td>
          </tr>`).join('') || '<tr><td colspan="5">Aucune prestation</td></tr>';
      }
    }

    document.querySelectorAll('[data-edit-service]').forEach(button => {
      button.onclick = () => editService(button.dataset.editService);
    });
    document.querySelectorAll('[data-delete-service]').forEach(button => {
      button.onclick = () => deleteService(button.dataset.deleteService);
    });

    document.querySelectorAll('.ligne-prestation').forEach(select => {
      const value = select.value;
      select.innerHTML = '<option value="">-- Prestation --</option>' + state.services.map(service => `
        <option value="${service.id}" data-prix="${service.prix}">${safe(service.libelle)} - ${euro(service.prix)}</option>`
      ).join('');
      select.value = value;
    });
  }

  function editService(id) {
    const service = state.services.find(item => String(item.id) === String(id));
    if (!service) return;
    state.currentService = id;
    [['pr-libelle', service.libelle], ['pr-type', service.type], ['pr-quantite', service.quantite], ['pr-prix', service.prix]].forEach(([fieldId, value]) => {
      const field = $(fieldId);
      if (field) field.value = value ?? '';
    });
    const submit = $('pr-submit-btn');
    if (submit) submit.textContent = 'Enregistrer';
    const cancel = $('pr-annuler');
    if (cancel) cancel.style.display = 'inline-block';
    openTab('prestations');
  }

  async function deleteService(id) {
    if (!confirm('Supprimer cette prestation ?')) return;
    const { error } = await db.from('prestations').update({ actif: false }).eq('id', id);
    if (error) return alert(error.message);
    await loadServices();
  }

  function resetForm() {
    state.currentService = null;
    $('form-prestation')?.reset();
    const submit = $('pr-submit-btn');
    if (submit) submit.textContent = 'Ajouter';
    const cancel = $('pr-annuler');
    if (cancel) cancel.style.display = 'none';
  }

  function bindForm() {
    const form = $('form-prestation');
    if (!form || form.dataset.prestationsBound === 'true') return;
    form.dataset.prestationsBound = 'true';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = {
        libelle: $('pr-libelle')?.value || '',
        type: $('pr-type')?.value || '',
        quantite: $('pr-quantite')?.value || null,
        prix: $('pr-prix')?.value || 0
      };
      const result = state.currentService
        ? await db.from('prestations').update(payload).eq('id', state.currentService)
        : await db.from('prestations').insert(payload);
      if (result.error) return alert(result.error.message);
      resetForm();
      await loadServices();
    });
    $('pr-annuler')?.addEventListener('click', resetForm);
  }

  return { loadServices, bindForm, resetForm };
}
