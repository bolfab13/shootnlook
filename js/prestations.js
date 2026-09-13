export function createPrestationsModule({ db, $, state }) {
  const getServices = () => state.services || [];

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
      table.querySelector('tbody').innerHTML = getServices().map(service => `
        <tr>
          <td>${escapeHtml(service.libelle)}</td>
          <td>${escapeHtml(service.type || '')}</td>
          <td>${service.quantite ?? ''}</td>
          <td>${Number(service.prix || 0).toFixed(2)} EUR</td>
          <td>
            <button type="button" data-edit-service="${service.id}">Modifier</button>
            <button type="button" data-delete-service="${service.id}">Supprimer</button>
          </td>
        </tr>`).join('') || '<tr><td colspan="5">Aucune prestation</td></tr>';
    }

    document.querySelectorAll('[data-edit-service]').forEach(button => {
      button.onclick = () => editService(button.dataset.editService);
    });
    document.querySelectorAll('[data-delete-service]').forEach(button => {
      button.onclick = () => deleteService(button.dataset.deleteService);
    });

    document.querySelectorAll('.ligne-prestation').forEach(select => {
      const value = select.value;
      select.innerHTML = '<option value="">-- Prestation --</option>' + getServices().map(service =>
        `<option value="${service.id}" data-prix="${Number(service.prix || 0)}">${escapeHtml(service.libelle)} - ${Number(service.prix || 0).toFixed(2)} EUR</option>`
      ).join('');
      select.value = value;
    });
  }

  function editService(id) {
    const service = getServices().find(item => String(item.id) === String(id));
    if (!service) return;
    state.currentService = service.id;
    setValue('pr-libelle', service.libelle);
    setValue('pr-type', service.type);
    setValue('pr-quantite', service.quantite);
    setValue('pr-prix', service.prix);
    setText('pr-submit-btn', 'Enregistrer');
    const cancel = $('pr-annuler');
    if (cancel) cancel.style.display = 'inline-block';
  }

  async function deleteService(id) {
    if (!confirm('Supprimer cette prestation ?')) return;
    const { error } = await db.from('prestations').update({ actif: false }).eq('id', id);
    if (error) return alert(error.message);
    await loadServices();
  }

  function bindForm() {
    const form = $('form-prestation');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = {
        libelle: $('pr-libelle')?.value || '',
        type: $('pr-type')?.value || '',
        quantite: $('pr-quantite')?.value || null,
        prix: $('pr-prix')?.value || 0
      };
      const query = state.currentService
        ? db.from('prestations').update(payload).eq('id', state.currentService)
        : db.from('prestations').insert(payload);
      const { error } = await query;
      if (error) return alert(error.message);
      resetForm();
      await loadServices();
    });

    $('pr-annuler')?.addEventListener('click', resetForm);
  }

  function resetForm() {
    state.currentService = null;
    $('form-prestation')?.reset();
    setText('pr-submit-btn', 'Ajouter');
    const cancel = $('pr-annuler');
    if (cancel) cancel.style.display = 'none';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function setValue(id, value) {
    const element = $(id);
    if (element) element.value = value ?? '';
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  return { loadServices, bindForm, resetForm };
}
