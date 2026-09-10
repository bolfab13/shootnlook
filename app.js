document.addEventListener('DOMContentLoaded',()=>{
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY),$=id=>document.getElementById(id),root=document.documentElement,layout=document.querySelector('.layout'),euro=n=>`${Number(n||0).toFixed(2)} EUR`,today=()=>new Date().toISOString().slice(0,10),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let settings={id:null,rappels_jours:[30,14,7,2,1],rappel_affichage_limite:3,types_paiement:['espece','cheque','virement','sans_contact'],prefixe_facture:'FACT-',prochain_numero_facture:1,taux_km:.606,mention_tva:'TVA non applicable, art. 293 B du CGI'},ecuries=[],cavaliers=[],shootings=[],chart=null,map=null,currentEcurie=null,currentCavaliere=null,currentShooting=null,calCursor=new Date(),bellItems=[],unpaidItems=[];
const titles={dashboard:'Tableau de bord',calendrier:'Calendrier',ecuries:'Ecuries',cavaliers:'Cavalier(e)s',shootings:'Shootings',prestations:'Grille tarifaire',facturation:'Creer une facture',factures:'Factures emises',reglages:'Reglages'};
const defaults={dashboard:'bx bx-home-circle',calendrier:'bx bx-calendar',ecuries:'bx bx-buildings',cavaliers:'bx bx-group',shootings:'bx bx-camera-movie',prestations:'bx bx-camera',facturation:'bx bx-receipt',factures:'bx bx-file',reglages:'bx bx-cog'};
const icons=()=>{try{return JSON.parse(localStorage.getItem('boxicons_menu'))||{}}catch{return{}}};
function applyIcons(){const x=icons();document.querySelectorAll('#tabs button[data-tab]').forEach(b=>{const i=b.querySelector('.icon');if(i)i.className=`icon ${x[b.dataset.tab]||defaults[b.dataset.tab]}`});document.querySelectorAll('[data-preview-icon]').forEach(i=>i.className=x[i.dataset.previewIcon]||defaults[i.dataset.previewIcon])}
function initIconFields(){const x=icons();document.querySelectorAll('[data-menu-icon]').forEach(i=>{const n=i.dataset.menuIcon;i.value=x[n]||defaults[n];i.oninput=()=>{const z=icons();z[n]=i.value.trim()||defaults[n];localStorage.setItem('boxicons_menu',JSON.stringify(z));applyIcons()}})}
function setTheme(v){root.dataset.theme=v;localStorage.setItem('theme',v);$('setting-theme').value=v;if(chart){chart.destroy();chart=null;loadDashboard()}}
function setColorTheme(v){root.dataset.colorTheme=v;localStorage.setItem('colorTheme',v);const c=JSON.parse(localStorage.getItem('customColors')||'{}');if(v==='custom'){Object.entries(c).forEach(([k,x])=>{root.style.setProperty(k,x)})}else{root.removeAttribute('style')} }
function setLayout(v){root.dataset.layout=v;localStorage.setItem('layout',v);$('setting-layout').value=v}function setSidebar(v){root.dataset.sidebar=v;localStorage.setItem('sidebar',v);$('setting-sidebar').value=v}
function closeMenus(){$('settings-menu')?.classList.remove('open');$('user-menu')?.classList.remove('open');$('bell-menu')?.classList.remove('open');$('unpaid-menu')?.classList.remove('open')}
function openTab(n){document.querySelector(`#tabs button[data-tab="${n}"]`)?.click()}
function profile(){const p=localStorage.getItem('profil_pseudo')||'Admin';[['pf-pseudo',p],['pf-societe',localStorage.getItem('profil_societe')||''],['pf-adresse',localStorage.getItem('profil_adresse')||''],['pf-code-postal',localStorage.getItem('profil_code_postal')||''],['pf-ville',localStorage.getItem('profil_ville')||''],['topbar-user-name',p],['menu-user-name',p],['dashboard-user-name',p]].forEach(([id,v])=>{if($(id))$(id).value!==undefined?$(id).value=v:$(id).textContent=v});document.querySelectorAll('.user-avatar').forEach(x=>x.textContent=p[0]?.toUpperCase()||'A')}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab)?.classList.add('active');$('page-title').textContent=titles[b.dataset.tab]||'';layout.classList.remove('mobile-menu');closeMenus();if(b.dataset.tab==='dashboard')loadDashboard();if(b.dataset.tab==='calendrier')renderCalendar()});
$('sidebar-toggle').onclick=()=>innerWidth<=780?layout.classList.toggle('mobile-menu'):setSidebar(root.dataset.sidebar==='compact'?'normal':'compact');$('settings-toggle').onclick=e=>{e.stopPropagation();closeMenus();$('settings-menu').classList.toggle('open')};$('user-toggle').onclick=e=>{e.stopPropagation();closeMenus();$('user-menu').classList.toggle('open')};$('bell-toggle').onclick=e=>{e.stopPropagation();closeMenus();$('bell-menu').classList.toggle('open')};$('unpaid-toggle').onclick=e=>{e.stopPropagation();closeMenus();$('unpaid-menu').classList.toggle('open')};document.onclick=e=>{if(!e.target.closest('.topbar-menu-wrap'))closeMenus()};$('setting-theme').onchange=e=>setTheme(e.target.value);$('setting-layout').onchange=e=>setLayout(e.target.value);$('setting-sidebar').onchange=e=>setSidebar(e.target.value);$('setting-color-theme').onchange=e=>setColorTheme(e.target.value);$('open-reglages-btn').onclick=()=>{closeMenus();openTab('reglages')};$('edit-profile-btn').onclick=()=>{$('profile-modal').classList.add('visible');closeMenus()};$('fermer-profil').onclick=()=> $('profile-modal').classList.remove('visible');$('fermer-notifs').onclick=()=> $('modal-notifs').classList.remove('visible');$('fermer-facture').onclick=()=> $('modal-facture').classList.remove('visible');document.querySelectorAll('[data-open-tab]').forEach(b=>b.onclick=()=>openTab(b.dataset.openTab));
$('form-profil').onsubmit=async e=>{e.preventDefault();const p=$('pf-pseudo').value.trim()||'Admin';localStorage.setItem('profil_pseudo',p);localStorage.setItem('profil_societe',$('pf-societe').value);localStorage.setItem('profil_adresse',$('pf-adresse').value);localStorage.setItem('profil_code_postal',$('pf-code-postal').value);localStorage.setItem('profil_ville',$('pf-ville').value);profile();$('profile-modal').classList.remove('visible')};
async function geocode(q){try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=fr&q=${encodeURIComponent(q)}`,{headers:{'Accept-Language':'fr'}});return await r.json()}catch{return[]}}
async function road(a,b,c,d){try{const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${b},${a};${d},${c}?overview=false`),x=await r.json();return x.routes?.[0]?x.routes[0].distance/1000:null}catch{return null}}
function showSearch(results){const box=$('ec-recherche-resultats');if(!box)return;if(!results.length){box.innerHTML='<p class="aide">Aucune ecurie trouvee. Saisie manuelle possible ci-dessous.</p>';box.classList.add('visible');return}box.innerHTML=results.map((r,i)=>{const a=r.address||{};return`<button type="button" class="stable-result" data-i="${i}"><strong>${esc(r.name||r.display_name.split(',')[0])}</strong><span>${esc(r.display_name||'')}</span><small>${esc(a.postcode||'')} ${esc(a.city||a.town||a.village||a.municipality||'')}</small></button>`}).join('');box.classList.add('visible');box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const r=results[Number(b.dataset.i)],a=r.address||{};$('ec-nom').value=r.name||r.display_name.split(',')[0];$('ec-adresse').value=`${a.house_number||''} ${a.road||a.pedestrian||''}`.trim();$('ec-cp').value=a.postcode||'';$('ec-ville').value=a.city||a.town||a.village||a.municipality||'';$('ec-lat').value=r.lat||'';$('ec-lon').value=r.lon||'';$('ec-coords-statut').textContent='Coordonnees trouvees';box.classList.remove('visible')})}
$('ec-rechercher').onclick=async()=>{const n=$('ec-recherche-nom').value.trim(),v=$('ec-recherche-ville').value.trim();if(!n&&!v)return alert('Saisis un nom ou une ville.');const b=$('ec-rechercher');b.disabled=true;b.textContent='Recherche...';showSearch(await geocode(`${n} ${v} France`));b.disabled=false;b.textContent='Rechercher'};
async function loadSettings(){const {data,error}=await db.from('reglages').select('*').limit(1).single();if(error)return console.error(error);if(data){settings={...settings,...data,rappels_jours:data.rappels_jours?.length?data.rappels_jours:settings.rappels_jours,types_paiement:data.types_paiement?.length?data.types_paiement:settings.types_paiement,rappel_affichage_limite:data.rappel_affichage_limite||3};document.querySelectorAll('.rg-rappel').forEach(c=>c.checked=settings.rappels_jours.includes(Number(c.value)));document.querySelectorAll('.rg-paiement').forEach(c=>c.checked=settings.types_paiement.includes(c.value));$('rg-bell-limite').value=settings.rappel_affichage_limite;nomEntreprise(data.nom_entreprise);renderPayments()}}
function nomEntreprise(n){$('sidebar-company-name').textContent=String(n||'').trim()||'PHOTO EQUESTRE'}function paymentLabel(v){return{espece:'Espece',cheque:'Cheque',virement:'Virement',sans_contact:'Sans contact'}[v]||v}function renderPayments(){const o=(settings.types_paiement||[]).map(v=>`<option value="${v}">${paymentLabel(v)}</option>`).join('');$('fa-paiement').innerHTML='<option value="">-- Type de paiement --</option>'+o;$('filtre-paiement').innerHTML='<option value="">Tous les paiements</option>'+o}
$('form-reglages').onsubmit=async e=>{e.preventDefault();const p={nom_entreprise:$('rg-nom-entreprise').value,adresse:$('rg-adresse-entreprise').value,code_postal_entreprise:$('rg-code-postal-entreprise').value,ville_entreprise:$('rg-ville-entreprise').value,siret:$('rg-siret').value,mention_tva:$('rg-tva').value,prefixe_facture:$('rg-prefixe').value,rappels_jours:Array.from(document.querySelectorAll('.rg-rappel:checked')).map(x=>Number(x.value)),rappel_affichage_limite:Number($('rg-bell-limite').value)||3,types_paiement:Array.from(document.querySelectorAll('.rg-paiement:checked')).map(x=>x.value)};const {error}=await db.from('reglages').update(p).eq('id',settings.id);if(error)return alert(error.message);await loadSettings();alert('Reglages enregistres')};
async function loadStables(){const {data,error}=await db.from('ecuries').select('*').order('nom');if(error)return console.error(error);ecuries=data;const {data:ca}=await db.from('cavalieres').select('id,ecurie_id');$('table-ecuries').querySelector('tbody').innerHTML=ecuries.map(e=>`<tr><td>${esc(e.nom)}</td><td>${esc(e.adresse)}</td><td>${esc(e.code_postal)}</td><td>${esc(e.ville)}</td><td>${e.distance_domicile_km?e.distance_domicile_km.toFixed(1)+' km A/R':'-'}</td><td>${(ca||[]).filter(x=>x.ecurie_id===e.id).length}</td><td><button data-edit="${e.id}">Modifier</button><button class="btn-danger" data-del="${e.id}">Supprimer</button></td></tr>`).join('');$('table-ecuries').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editStable(b.dataset.edit));$('table-ecuries').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteStable(b.dataset.del));const o='<option value="">-- Ecurie --</option>'+ecuries.map(e=>`<option value="${e.id}">${esc(e.nom)}</option>`).join('');$('cav-ecurie').innerHTML=o;$('sh-ecurie').innerHTML='<option value="">-- Ecurie / lieu --</option>'+ecuries.map(e=>`<option value="${e.id}">${esc(e.nom)}</option>`).join('')}
function editStable(id){const e=ecuries.find(x=>x.id==id);if(!e)return;currentEcurie=id;[['ec-nom',e.nom],['ec-ville',e.ville],['ec-adresse',e.adresse],['ec-cp',e.code_postal],['ec-contact-nom',e.contact_nom],['ec-lat',e.latitude],['ec-lon',e.longitude]].forEach(([i,v])=>$(i).value=v||'');$('ec-submit-btn').textContent='Enregistrer';$('ec-annuler').style.display='inline-block';openTab('ecuries')}$('ec-annuler').onclick=()=>{currentEcurie=null;$('form-ecurie').reset();$('ec-submit-btn').textContent='Ajouter';$('ec-annuler').style.display='none'};async function deleteStable(id){if(confirm('Supprimer cette ecurie ?')){await db.from('ecuries').delete().eq('id',id);loadStables()}}$('form-ecurie').onsubmit=async e=>{e.preventDefault();const lat=$('ec-lat').value||null,lon=$('ec-lon').value||null,d=lat&&lon&&settings.domicile_latitude&&settings.domicile_longitude?await road(settings.domicile_latitude,settings.domicile_longitude,lat,lon):null,p={nom:$('ec-nom').value,ville:$('ec-ville').value,adresse:$('ec-adresse').value||null,code_postal:$('ec-cp').value||null,contact_nom:$('ec-contact-nom').value||null,latitude:lat,longitude:lon,distance_domicile_km:d};const q=currentEcurie?db.from('ecuries').update(p).eq('id',currentEcurie):db.from('ecuries').insert(p),r=await q;if(r.error)return alert(r.error.message);$('ec-annuler').click();loadStables()};
async function loadRiders(){const {data,error}=await db.from('cavalieres').select('*, ecuries(nom)').order('prenom');if(error)return console.error(error);cavaliers=data;const {data:fa}=await db.from('factures').select('id,cavaliere_id');const q=($('filtre-cavalieres').value||'').toLowerCase(),x=cavaliers.filter(c=>`${c.prenom||''} ${c.nom||''} ${c.ecuries?.nom||''}`.toLowerCase().includes(q));$('table-cavalieres').querySelector('tbody').innerHTML=x.map(c=>`<tr data-rider-id="${c.id}"><td>${esc(c.prenom)}</td><td>${esc(c.nom)}</td><td>${esc(c.ecuries?.nom)||'-'}</td><td>${esc(c.nom_cheval)||'-'}</td><td>${c.ambassadeur?'<i class="bx bxs-star star-ambassadeur"></i> Oui':'Non'}</td><td>${(fa||[]).filter(z=>z.cavaliere_id===c.id).length}</td><td><button data-edit="${c.id}">Modifier</button><button class="btn-danger" data-del="${c.id}">Supprimer</button></td></tr>`).join('');$('table-cavalieres').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editRider(b.dataset.edit));$('table-cavalieres').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteRider(b.dataset.del));const o='<option value="">-- Cavalier(e) --</option>'+cavaliers.map(c=>`<option value="${c.id}">${c.ambassadeur?'* ':''}${esc(c.prenom)} ${esc(c.nom)}</option>`).join('');$('fa-cavaliere').innerHTML=o;$('sh-cavaliere').innerHTML='<option value="">-- Cavalier(e) (optionnel) --</option>'+cavaliers.map(c=>`<option value="${c.id}">${c.ambassadeur?'* ':''}${esc(c.prenom)} ${esc(c.nom)}</option>`).join('')}
function editRider(id){const c=cavaliers.find(x=>x.id==id);if(!c)return;currentCavaliere=id;[['cav-prenom',c.prenom],['cav-nom',c.nom],['cav-ecurie',c.ecurie_id],['cav-cheval',c.nom_cheval],['cav-tel',c.telephone],['cav-email',c.email]].forEach(([i,v])=>$(i).value=v||'');$('cav-ambassadeur').checked=!!c.ambassadeur;$('cav-submit-btn').textContent='Enregistrer';$('cav-annuler').style.display='inline-block';openTab('cavaliers')}$('cav-annuler').onclick=()=>{currentCavaliere=null;$('form-cavaliere').reset();$('cav-submit-btn').textContent='Ajouter';$('cav-annuler').style.display='none'};async function deleteRider(id){if(confirm('Supprimer ce/cette cavalier(e) ?')){await db.from('cavalieres').delete().eq('id',id);loadRiders()}}$('form-cavaliere').onsubmit=async e=>{e.preventDefault();const p={prenom:$('cav-prenom').value||null,nom:$('cav-nom').value||null,ecurie_id:$('cav-ecurie').value||null,nom_cheval:$('cav-cheval').value||null,telephone:$('cav-tel').value||null,email:$('cav-email').value||null,ambassadeur:$('cav-ambassadeur').checked},q=currentCavaliere?db.from('cavalieres').update(p).eq('id',currentCavaliere):db.from('cavalieres').insert(p),r=await q;if(r.error)return alert(r.error.message);$('cav-annuler').click();loadRiders()};$('filtre-cavalieres').oninput=loadRiders;
async function loadShootings(){const {data,error}=await db.from('concours').select('*, ecuries(nom), cavalieres(nom,prenom)').order('date_debut');if(error)return console.error(error);shootings=data;$('table-shootings').querySelector('tbody').innerHTML=shootings.map(s=>`<tr data-shooting-id="${s.id}"><td>${esc(s.nom)}</td><td>${s.type_shooting==='concours'?'Concours':'Shooting perso.'}</td><td>${esc(s.ecuries?.nom||s.lieu||'-')}</td><td>${s.cavalieres?esc(s.cavalieres.prenom)+' '+esc(s.cavalieres.nom):'-'}</td><td>${s.date_debut}${s.date_fin&&s.date_fin!==s.date_debut?' -> '+s.date_fin:''}</td><td><button data-edit="${s.id}">Modifier</button><button class="btn-danger" data-del="${s.id}">Supprimer</button></td></tr>`).join('');$('table-shootings').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editShooting(b.dataset.edit));$('table-shootings').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteShooting(b.dataset.del));refreshBell();renderCalendar()}
function editShooting(id){const s=shootings.find(x=>x.id==id);if(!s)return;currentShooting=id;[['sh-nom',s.nom],['sh-type',s.type_shooting||'concours'],['sh-ecurie',s.ecurie_id],['sh-cavaliere',s.cavaliere_id||''],['sh-debut',s.date_debut],['sh-fin',s.date_fin],['sh-heure-debut',s.heure_debut],['sh-heure-fin',s.heure_fin],['sh-distance',s.distance_km],['sh-notes',s.notes]].forEach(([i,v])=>$(i).value=v||'');$('sh-rappel').checked=s.rappel_actif!==false;$('sh-submit-btn').textContent='Enregistrer';$('sh-annuler').style.display='inline-block';openTab('shootings')}$('sh-annuler').onclick=()=>{currentShooting=null;$('form-shooting').reset();$('sh-submit-btn').textContent='Ajouter';$('sh-annuler').style.display='none'};async function deleteShooting(id){if(confirm('Supprimer ce shooting ?')){await db.from('concours').delete().eq('id',id);loadShootings()}}$('form-shooting').onsubmit=async e=>{e.preventDefault();const ec=ecuries.find(x=>String(x.id)==String($('sh-ecurie').value)),p={nom:$('sh-nom').value,type_shooting:$('sh-type').value,ecurie_id:$('sh-ecurie').value||null,cavaliere_id:$('sh-cavaliere').value||null,date_debut:$('sh-debut').value,date_fin:$('sh-fin').value||$('sh-debut').value,heure_debut:$('sh-heure-debut').value||null,heure_fin:$('sh-heure-fin').value||null,distance_km:$('sh-distance').value||null,notes:$('sh-notes').value,rappel_actif:$('sh-rappel').checked,lieu:ec?.nom||null},q=currentShooting?db.from('concours').update(p).eq('id',currentShooting):db.from('concours').insert(p),r=await q;if(r.error)return alert(r.error.message);$('sh-annuler').click();loadShootings()};
async function loadServices(){const {data,error}=await db.from('prestations').select('*').eq('actif',true).order('prix');if(error)return console.error(error);$('table-prestations').querySelector('tbody').innerHTML=data.map(x=>`<tr><td>${esc(x.libelle)}</td><td>${esc(x.type)}</td><td>${x.quantite||'-'}</td><td>${euro(x.prix)}</td><td><button class="btn-danger" data-del="${x.id}">Supprimer</button></td></tr>`).join('');document.querySelectorAll('.ligne-prestation').forEach(s=>{const v=s.value;s.innerHTML='<option value="">-- Prestation --</option>'+data.map(x=>`<option value="${x.id}" data-prix="${x.prix}">${esc(x.libelle)} - ${euro(x.prix)}</option>`).join('');s.value=v})}$('form-prestation').onsubmit=async e=>{e.preventDefault();const r=await db.from('prestations').insert({libelle:$('pr-libelle').value,type:$('pr-type').value,quantite:$('pr-quantite').value||null,prix:$('pr-prix').value});if(r.error)return alert(r.error.message);e.target.reset();loadServices()};
function calculate(){let t=0;document.querySelectorAll('.ligne-facture').forEach(l=>{const p=l.querySelector('.ligne-prestation').selectedOptions[0]?.dataset.prix||0,q=l.querySelector('.ligne-qte').value||1,s=p*q;l.querySelector('.ligne-total').textContent=euro(s);t+=s});const k=$('fa-deplacement').checked?$('fa-km').value||0:0,d=k*settings.taux_km;$('fa-montant-deplacement').textContent=euro(d);$('fa-total').textContent=euro(t+d)}$('ajouter-ligne').onclick=()=>{const d=document.createElement('div');d.className='ligne-facture';d.innerHTML='<select class="ligne-prestation"></select><input class="ligne-qte" type="number" value="1" min="1"><span class="ligne-total">0.00 EUR</span><button type="button" class="btn-danger">-</button>';d.querySelector('button').onclick=()=>{d.remove();calculate()};$('lignes-container').appendChild(d);loadServices().then(bindLines)};function bindLines(){document.querySelectorAll('.ligne-prestation,.ligne-qte').forEach(x=>x.onchange=calculate)}$('fa-deplacement').onchange=()=>{$('fa-km').disabled=!$('fa-deplacement').checked;calculate()};$('fa-km').oninput=calculate;$('fa-shooting').onchange=()=>{const k=$('fa-shooting').selectedOptions[0]?.dataset.distance||0;if(k){$('fa-km').value=k;$('fa-deplacement').checked=true;$('fa-km').disabled=false;calculate()}};
$('form-facture').onsubmit=async e=>{e.preventDefault();const id=$('fa-cavaliere').value;if(!id)return alert('Selectionne un(e) cavalier(e).');const lines=[];document.querySelectorAll('.ligne-facture').forEach(l=>{const o=l.querySelector('.ligne-prestation').selectedOptions[0];if(o?.value){const q=l.querySelector('.ligne-qte').value||1,p=o.dataset.prix;lines.push({prestation_id:o.value,libelle:o.textContent.split(' - ')[0],quantite:q,prix_unitaire:p,sous_total:p*q})}});if(!lines.length)return alert('Ajoute une prestation.');const k=$('fa-deplacement').checked?$('fa-km').value||0:0,d=k*settings.taux_km,total=lines.reduce((s,x)=>s+Number(x.sous_total),0)+d,num=settings.prefixe_facture+String(settings.prochain_numero_facture).padStart(3,'0');const r=await db.from('factures').insert({numero:num,date_facture:$('fa-date').value,cavaliere_id:id,concours_id:$('fa-shooting').value||null,lieu:$('fa-lieu').value,deplacement_km:k,montant_deplacement:d,montant_total:total,mention_tva:settings.mention_tva,type_paiement:$('fa-paiement').value||null}).select().single();if(r.error)return alert(r.error.message);await db.from('lignes_facture').insert(lines.map(x=>({...x,facture_id:r.data.id})));await db.from('reglages').update({prochain_numero_facture:settings.prochain_numero_facture+1}).eq('id',settings.id);settings.prochain_numero_facture++;e.target.reset();$('fa-date').value=today();$('fa-km').disabled=true;calculate();loadInvoices();loadDashboard()};
async function loadInvoices(){let q=db.from('factures').select('*, cavalieres(nom,prenom), lignes_facture(libelle,quantite,sous_total)').order('date_facture',{ascending:false});const d1=$('filtre-date-debut').value,d2=$('filtre-date-fin').value,s=$('filtre-statut').value,p=$('filtre-paiement').value;if(d1)q=q.gte('date_facture',d1);if(d2)q=q.lte('date_facture',d2);if(s)q=q.eq('statut_paiement',s);if(p)q=q.eq('type_paiement',p);const r=await q;if(r.error)return console.error(r.error);const data=r.data||[];const total=data.reduce((s,f)=>s+Number(f.montant_total||0),0);$('factures-total-global').textContent=euro(total);$('factures-total-periode').textContent=euro(total);$('factures-total-periode-label').textContent=d1||d2?'Total periode':'Total filtre actif';$('table-factures').querySelector('tbody').innerHTML=data.map(f=>{const l=f.lignes_facture||[],resume=l.length?l.map(x=>`${x.libelle} (x${x.quantite})`).join(', '):'Aucune prestation',tooltip=l.map(x=>`<div>${esc(x.libelle)} x ${x.quantite} - ${euro(x.sous_total)}</div>`).join('');return`<tr data-invoice-id="${f.id}"><td>${esc(f.numero)}</td><td>${f.date_facture}</td><td>${esc(f.cavalieres?.prenom)} ${esc(f.cavalieres?.nom)}</td><td><span class="presta-resume">${esc(resume)}${l.length>1?' (plus)':''}<span class="presta-tooltip"><b>Prestations</b>${tooltip}</span></span></td><td>${euro(f.montant_total)}</td><td><select data-pay="${f.id}">${(settings.types_paiement||[]).map(x=>`<option value="${x}" ${f.type_paiement===x?'selected':''}>${paymentLabel(x)}</option>`).join('')}</select></td><td><select data-status="${f.id}"><option value="en_attente" ${f.statut_paiement==='en_attente'?'selected':''}>En attente</option><option value="payee" ${f.statut_paiement==='payee'?'selected':''}>Payee</option><option value="en_retard" ${f.statut_paiement==='en_retard'?'selected':''}>En retard</option></select></td><td><button class="btn-muted" data-view="${f.id}">Voir</button><button class="btn-danger" data-del="${f.id}">Supprimer</button></td></tr>`}).join('')||'<tr><td colspan="8">Aucune facture</td></tr>';document.querySelectorAll('[data-status]').forEach(x=>x.onchange=()=>db.from('factures').update({statut_paiement:x.value}).eq('id',x.dataset.status).then(loadInvoices));document.querySelectorAll('[data-pay]').forEach(x=>x.onchange=()=>db.from('factures').update({type_paiement:x.value}).eq('id',x.dataset.pay).then(loadInvoices));document.querySelectorAll('[data-del]').forEach(x=>x.onclick=async()=>{if(confirm('Supprimer cette facture ?')){await db.from('factures').delete().eq('id',x.dataset.del);loadInvoices();loadDashboard()}});document.querySelectorAll('[data-view]').forEach(x=>x.onclick=()=>{const f=data.find(z=>z.id==x.dataset.view),l=f?.lignes_facture||[];if(!f)return;$('facture-modal-titre').textContent=`Facture ${f.numero}`;$('facture-modal-contenu').innerHTML=`<div class="invoice-detail-list"><div class="invoice-detail-line"><span>Date</span><strong>${f.date_facture}</strong></div><div class="invoice-detail-line"><span>Cavalier(e)</span><strong>${esc(f.cavalieres?.prenom)} ${esc(f.cavalieres?.nom)}</strong></div><div class="invoice-detail-line"><span>Paiement</span><strong>${paymentLabel(f.type_paiement)||'-'}</strong></div>${l.map(x=>`<div class="invoice-detail-line"><span>${esc(x.libelle)} x ${x.quantite}</span><span>${euro(x.sous_total)}</span></div>`).join('')}<div class="invoice-detail-total"><strong>Total : ${euro(f.montant_total)}</strong></div></div>`;$('modal-facture').classList.add('visible')})}
['filtre-date-debut','filtre-date-fin','filtre-statut','filtre-paiement'].forEach(id=>$(id).onchange=loadInvoices);$('reinit-filtre-factures').onclick=()=>{['filtre-date-debut','filtre-date-fin','filtre-statut','filtre-paiement'].forEach(id=>$(id).value='');loadInvoices()};
																	  
function renderCalendar(){const y=calCursor.getFullYear(),m=calCursor.getMonth();$('calendar-title').textContent=calCursor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});$('calendar-head').innerHTML=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(x=>`<div>${x}</div>`).join('');const first=new Date(y,m,1),off=(first.getDay()+6)%7,last=new Date(y,m+1,0).getDate(),now=today();let cells=[];for(let i=0;i<off;i++)cells.push(null);for(let d=1;d<=last;d++)cells.push(new Date(y,m,d));while(cells.length%7)cells.push(null);$('calendar-grid').innerHTML=cells.map(dt=>{if(!dt)return'<div class="fc-day out"></div>';const iso=dt.toISOString().slice(0,10),ev=shootings.filter(s=>iso>=s.date_debut&&iso<=(s.date_fin||s.date_debut));return`<div class="fc-day ${iso===now?'today':''}" data-date="${iso}"><span class="fc-day-number">${dt.getDate()}</span>${ev.map(e=>{const lieu=e.ecuries?.nom||e.lieu||'Lieu inconnu',c=e.cavalieres?`${e.cavalieres.prenom} ${e.cavalieres.nom}`:'-',details=e.type_shooting==='concours'?`<b>${esc(e.nom)}</b><br><small>Lieu : ${esc(lieu)}</small>`:`<b>${esc(e.nom)}</b><br><small>Lieu : ${esc(lieu)}</small><br><small>Cavalier(e) : ${esc(c)}</small>`;return`<span class="fc-event ${e.type_shooting}" data-id="${e.id}">${esc(e.nom)}<span class="fc-event-tooltip">${details}</span></span>`}).join('')}</div>`}).join('');document.querySelectorAll('.fc-event').forEach(e=>e.onclick=x=>{x.stopPropagation();editShooting(e.dataset.id)});document.querySelectorAll('.fc-day[data-date]').forEach(d=>d.onclick=()=>{$('sh-debut').value=d.dataset.date;$('sh-fin').value=d.dataset.date;openTab('shootings')})}
$('calendar-prev').onclick=()=>{calCursor.setMonth(calCursor.getMonth()-1);renderCalendar()};$('calendar-next').onclick=()=>{calCursor.setMonth(calCursor.getMonth()+1);renderCalendar()};$('calendar-today').onclick=()=>{calCursor=new Date();renderCalendar()};$('filter-concours').onchange=renderCalendar;$('filter-personnalise').onchange=renderCalendar;$('calendar-create').onclick=()=>{$('sh-debut').value=today();$('sh-fin').value=today();openTab('shootings')};
function reminderItems(){const t=new Date(today()),a=[];(shootings||[]).forEach(s=>{if(s.rappel_actif===false)return;const d=Math.ceil((new Date(s.date_debut)-t)/86400000);if(d>=0&&(settings.rappels_jours||[7]).some(x=>x>=d))a.push({kind:'shooting',id:s.id,s,d,label:d===0?"Aujourd'hui":d===1?'Demain':`Dans ${d} jours`})});return a.sort((x,y)=>x.d-y.d)}
function unpaid(){return unpaidItems}
function unpaidHTML(f){return`<div class="bell-item unpaid-item" data-invoice-id="${f.id}"><span class="bell-icon-dot" style="background:var(--warning)"><i class="bx bx-wallet"></i></span><div class="bell-item-body"><span class="bell-when">Paiement attendu</span><strong>${esc(f.numero)}</strong><span class="bell-type">${esc(f.cavalieres?.prenom)} ${esc(f.cavalieres?.nom)} - ${euro(f.montant_total)}</span></div></div>`}
function refreshBell(){bellItems=reminderItems();$('bell-badge').textContent=bellItems.length;$('bell-badge').classList.toggle('hidden',!bellItems.length);$('bell-count-pill').textContent=`${bellItems.length} notification${bellItems.length===1?'':'s'}`;const n=bellItems.slice(0,settings.rappel_affichage_limite||3);$('bell-list').innerHTML=n.map(x=>`<div class="bell-item" data-shooting-id="${x.id}"><span class="bell-icon-dot ${x.s.type_shooting}"><i class="bx ${x.s.type_shooting==='concours'?'bx-trophy':'bx-camera-movie'}"></i></span><div class="bell-item-body"><span class="bell-when">${x.label}</span><strong>${esc(x.s.nom)}</strong><span class="bell-type">${x.s.type_shooting==='concours'?'Concours':'Shooting personnalise'} - ${x.s.date_debut}</span></div></div>`).join('')||'<p class="aide" style="padding:16px">Aucun rappel.</p>';document.querySelectorAll('[data-shooting-id]').forEach(x=>x.onclick=()=>{openTab('shootings');setTimeout(()=>{const r=document.querySelector(`[data-shooting-id="${x.dataset.shootingId}"]`);r?.classList.add('row-highlight');setTimeout(()=>r?.classList.remove('row-highlight'),3000)},100)});$('bell-footer').style.display=bellItems.length>(settings.rappel_affichage_limite||3)?'block':'none';if(bellItems.length>(settings.rappel_affichage_limite||3))$('bell-voir-plus').innerHTML=`Voir plus (${bellItems.length-(settings.rappel_affichage_limite||3)})`}
async function refreshUnpaid(){const r=await db.from('factures').select('id,numero,montant_total,statut_paiement,cavalieres(prenom,nom)').in('statut_paiement',['en_attente','en_retard']).order('date_facture');unpaidItems=r.data||[];const n=unpaidItems.length;$('unpaid-badge').textContent=n;$('unpaid-badge').classList.toggle('hidden',!n);$('unpaid-count-pill').textContent=n;$('unpaid-list').innerHTML=n?unpaidItems.slice(0,10).map(unpaidHTML).join(''):'<p class="aide" style="padding:16px">Aucune facture non payee.</p>';document.querySelectorAll('.unpaid-item').forEach(x=>x.onclick=()=>{openTab('factures');setTimeout(()=>{const r=document.querySelector(`[data-invoice-id="${x.dataset.invoiceId}"]`);r?.classList.add('row-highlight');r?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>r?.classList.remove('row-highlight'),3000)},100)})}
$('bell-voir-plus').onclick=()=>{$('notifs-full-list').innerHTML=bellItems.map(x=>`<div class="bell-item" data-shooting-id="${x.id}"><strong>${esc(x.s.nom)}</strong><span>${x.label} - ${x.s.date_debut}</span></div>`).join('');$('bell-menu').classList.remove('open');$('modal-notifs').classList.add('visible')};$('save-custom-theme').onclick=()=>{const c={'--accent':$('custom-accent').value,'--sidebar-bg':$('custom-sidebar').value,'--bg-body':$('custom-background').value};localStorage.setItem('customColors',JSON.stringify(c));setColorTheme('custom');alert('Theme personnalise enregistre')};
async function loadDashboard() {
  try {
    const [ridersResult, stablesResult, invoicesResult, shootingsResult] =
      await Promise.all([
        db.from('cavalieres').select('id'),
        db.from('ecuries').select('id'),
        db.from('factures').select('*, cavalieres(nom,prenom)'),
        db.from('concours').select('*').order('date_debut')
      ]);

    const riders = ridersResult.data || [];
    const stables = stablesResult.data || [];
    const invoices = invoicesResult.data || [];
    const shootingsData = shootingsResult.data || [];

    $('stat-cavalieres').textContent = riders.length;
    $('stat-ecuries').textContent = stables.length;

    const now = new Date();

    const paidInvoices = invoices.filter(
      invoice => invoice.statut_paiement === 'payee'
    );

    const currentMonthRevenue = paidInvoices
      .filter(invoice => {
        const date = new Date(`${invoice.date_facture}T12:00:00`);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (total, invoice) => total + Number(invoice.montant_total || 0),
        0
      );

    $('stat-ca-mois').textContent = euro(currentMonthRevenue);

    const unpaidCount = invoices.filter(invoice =>
      ['en_attente', 'en_retard'].includes(invoice.statut_paiement)
    ).length;

    $('stat-en-attente').textContent = unpaidCount;

    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    const labels = [];
    const monthlyRevenue = [];

    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      labels.push(monthNames[monthDate.getMonth()]);

      const amount = paidInvoices
        .filter(invoice => {
          const date = new Date(`${invoice.date_facture}T12:00:00`);
          return (
            date.getMonth() === monthDate.getMonth() &&
            date.getFullYear() === monthDate.getFullYear()
          );
        })
        .reduce(
          (total, invoice) => total + Number(invoice.montant_total || 0),
          0
        );

      monthlyRevenue.push(amount);
    }

    if (chart) {
      chart.destroy();
      chart = null;
    }

    const chartCanvas = $('chart-ca');

    if (window.Chart && chartCanvas) {
      chart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'CA encaissé',
              data: monthlyRevenue,
              backgroundColor:
                getComputedStyle(root)
                  .getPropertyValue('--accent')
                  .trim() || '#556ee6',
              borderRadius: 5,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: context =>
                  `CA encaissé : ${euro(context.raw)}`
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => euro(value)
              }
            }
          }
        }
      });
    }

    const upcomingShootings = shootingsData
      .filter(shooting => shooting.date_debut >= today())
      .slice(0, 5);

    $('liste-prochains-shootings').innerHTML = upcomingShootings
      .map(
        shooting => `
          <li>
            <span>${esc(shooting.nom)}</span>
            <span class="badge-date">${shooting.date_debut}</span>
          </li>
        `
      )
      .join('');

    const latestInvoices = [...invoices]
      .sort(
        (a, b) =>
          new Date(`${b.date_facture}T12:00:00`) -
          new Date(`${a.date_facture}T12:00:00`)
      )
      .slice(0, 5);

    const latestInvoicesTable = $('liste-dernieres-factures');

    if (latestInvoicesTable) {
      latestInvoicesTable.innerHTML = latestInvoices.length
        ? latestInvoices
            .map(
              invoice => `
                <tr>
                  <td>${esc(invoice.numero || '-')}</td>
                  <td>
                    ${esc(invoice.cavalieres?.prenom || '-')}
                    ${esc(invoice.cavalieres?.nom || '')}
                  </td>
                  <td>${esc(invoice.date_facture || '-')}</td>
                  <td>${euro(invoice.montant_total || 0)}</td>
                  <td>
                    <span class="badge-statut badge-${esc(
                      invoice.statut_paiement || 'en_attente'
                    )}">
                      ${esc(invoice.statut_paiement || 'en_attente')}
                    </span>
                  </td>
                </tr>
              `
            )
            .join('')
        : '<tr><td colspan="5">Aucune facture</td></tr>';
    }
  } catch (error) {
    console.error('Erreur de chargement du tableau de bord :', error);
  }
}
async function init(){setTheme(localStorage.getItem('theme')||'light');setLayout(localStorage.getItem('layout')||'vertical');setSidebar(localStorage.getItem('sidebar')||'normal');setColorTheme(localStorage.getItem('colorTheme')||'classic');profile();initIconFields();applyIcons();$('fa-date').value=today();await loadSettings();await loadStables();await loadRiders();await loadShootings();await loadServices();await loadInvoices();bindLines();calculate();await loadDashboard();await refreshUnpaid();renderCalendar()};init();
});
