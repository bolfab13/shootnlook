document.addEventListener('DOMContentLoaded', () => {
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const layout = document.querySelector('.layout');
  const euro = n => `${Number(n || 0).toFixed(2)} €`;
  const dateNow = () => new Date().toISOString().slice(0, 10);
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  const titles = { dashboard:'Tableau de bord', ecuries:'Ecuries', cavalieres:'Cavalieres', concours:'Concours', prestations:'Grille tarifaire', facturation:'Creer une facture', factures:'Factures emises', reglages:'Reglages' };
  let settings = { id:null, nom_entreprise:'', adresse:'', code_postal_entreprise:'', ville_entreprise:'', siret:'', logo_url:'', domicile_adresse:'', domicile_latitude:null, domicile_longitude:null, puissance_fiscale_cv:4, taux_km:.606, mention_tva:'TVA non applicable, art. 293 B du CGI', prefixe_facture:'FACT-2026-', prochain_numero_facture:1, vehicule_marque:'', vehicule_modele:'', vehicule_annee:null, vehicule_energie:'essence' };
  let chart = null, map = null, currentEcurie = null, currentCavaliere = null, currentConcours = null;
  let ecuries = [], cavaliers = [], concours = [];
  const defaultIcons = { dashboard:'bx bx-home-circle', ecuries:'bx bx-buildings', cavalieres:'bx bx-group', concours:'bx bx-trophy', prestations:'bx bx-camera', facturation:'bx bx-receipt', factures:'bx bx-file', reglages:'bx bx-cog' };
  const getIcons = () => { try { return JSON.parse(localStorage.getItem('boxicons_menu')) || {}; } catch { return {}; } };
  const applyIcons = () => { const x=getIcons(); document.querySelectorAll('#tabs button[data-tab]').forEach(b=>{const i=b.querySelector('.icon');if(i){i.className=`icon ${x[b.dataset.tab]||defaultIcons[b.dataset.tab]}`;i.textContent='';}});document.querySelectorAll('[data-preview-icon]').forEach(i=>{i.className=x[i.dataset.previewIcon]||defaultIcons[i.dataset.previewIcon]}) };
  const setTheme = v => { root.dataset.theme=v;localStorage.setItem('theme',v);if($('setting-theme'))$('setting-theme').value=v;if(chart){chart.destroy();chart=null;loadDashboard()} };
  const setLayout = v => {root.dataset.layout=v;localStorage.setItem('layout',v);if($('setting-layout'))$('setting-layout').value=v};
  const setSidebar = v => {root.dataset.sidebar=v;localStorage.setItem('sidebar',v);if($('setting-sidebar'))$('setting-sidebar').value=v};
  const closeMenus = () => {$('settings-menu')?.classList.remove('open');$('user-menu')?.classList.remove('open')};
  const openTab = name => document.querySelector(`#tabs button[data-tab="${name}"]`)?.click();
  function loadLocalProfile(){const p=localStorage.getItem('profil_pseudo')||'Admin',s=localStorage.getItem('profil_societe')||'',a=localStorage.getItem('profil_adresse')||'',cp=localStorage.getItem('profil_code_postal')||'',v=localStorage.getItem('profil_ville')||'';[['pf-pseudo',p],['pf-societe',s],['pf-adresse',a],['pf-code-postal',cp],['pf-ville',v],['topbar-user-name',p],['menu-user-name',p],['dashboard-user-name',p]].forEach(([id,val])=>{if($(id))$(id).value!==undefined?$(id).value=val:$(id).textContent=val});document.querySelectorAll('.user-avatar').forEach(x=>x.textContent=p[0]?.toUpperCase()||'A')}
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab)?.classList.add('active');$('page-title').textContent=titles[b.dataset.tab]||'';layout.classList.remove('mobile-menu');closeMenus();if(b.dataset.tab==='dashboard')loadDashboard()}));
  $('sidebar-toggle')?.addEventListener('click',()=>innerWidth<=780?layout.classList.toggle('mobile-menu'):setSidebar(root.dataset.sidebar==='compact'?'normal':'compact'));
  $('settings-toggle')?.addEventListener('click',e=>{e.stopPropagation();$('user-menu').classList.remove('open');$('settings-menu').classList.toggle('open')});
  $('user-toggle')?.addEventListener('click',e=>{e.stopPropagation();$('settings-menu').classList.remove('open');$('user-menu').classList.toggle('open')});
  document.addEventListener('click',e=>{if(!e.target.closest('.topbar-menu-wrap'))closeMenus()});
  $('setting-theme')?.addEventListener('change',e=>setTheme(e.target.value));
  $('setting-layout')?.addEventListener('change',e=>setLayout(e.target.value));
  $('setting-sidebar')?.addEventListener('change',e=>setSidebar(e.target.value));
  $('edit-profile-btn')?.addEventListener('click',()=>{$('profile-modal').classList.add('visible');closeMenus()});
  $('close-profile-modal')?.addEventListener('click',()=>$('profile-modal').classList.remove('visible'));
  $('open-profile-modal')?.addEventListener('click',()=>$('profile-modal').classList.add('visible'));
  $('open-reglages-btn')?.addEventListener('click',()=>{closeMenus();openTab('reglages')});
  document.querySelectorAll('[data-open-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.openTab)));
  $('form-profil')?.addEventListener('submit',async e=>{e.preventDefault();const p=$('pf-pseudo').value.trim()||'Admin',s=$('pf-societe').value.trim(),a=$('pf-adresse').value.trim(),cp=$('pf-code-postal').value.trim(),v=$('pf-ville').value.trim();localStorage.setItem('profil_pseudo',p);localStorage.setItem('profil_societe',s);localStorage.setItem('profil_adresse',a);localStorage.setItem('profil_code_postal',cp);localStorage.setItem('profil_ville',v);if(settings.id)await db.from('reglages').update({nom_entreprise:s,adresse:a,code_postal_entreprise:cp,ville_entreprise:v}).eq('id',settings.id);loadLocalProfile();$('profile-modal').classList.remove('visible')});
  async function loadSettings(){const r=await db.from('reglages').select('*').single();if(r.data){settings=r.data;Object.assign(settings,r.data)}}
  async function loadEcuries(){const r=await db.from('ecuries').select('*').order('nom');ecuries=r.data||[]}
  async function loadCavalieres(){const r=await db.from('cavalieres').select('*').order('nom');cavaliers=r.data||[]}
  async function loadConcours(){const r=await db.from('concours').select('*').order('date_debut');concours=r.data||[]}
  async function loadDashboard(){if(!chart){const ctx=$('chart-ca')?.getContext('2d');if(ctx){chart=new window.Chart(ctx,{type:'line',data:{labels:['Jan','Fev','Mar','Avr','Mai','Jun'],datasets:[{label:'CA (€)',data:[0,0,0,0,0,0],borderColor:'var(--accent)',backgroundColor:'rgba(85,110,230,.12)',tension:.3,fill:!0}]},options:{responsive:!0,interaction:{mode:'index',intersect:!1},plugins:{legend:{display:!1},tooltip:{callbacks:{label:c=>euro(c.raw)}}}})}}}}
  async function init(){await loadSettings();await loadEcuries();await loadCavalieres();await loadConcours();loadLocalProfile();applyIcons();loadDashboard();console.info('App initialized, Supabase:',!!db)}
  init();
});