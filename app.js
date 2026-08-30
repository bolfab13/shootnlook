document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const titles = { dashboard:'Tableau de bord', ecuries:'Écuries', cavalieres:'Cavalières', concours:'Concours', prestations:'Grille tarifaire', facturation:'Créer une facture', factures:'Factures émises', reglages:'Réglages' };
  const state = { db: null, user: null, profile: null, signingUp: false };
  const authScreen = $('auth-screen');
  const appShell = $('app-shell');

  function showAuthMessage(message, type='error') { const box=$('auth-message'); box.textContent=message; box.className=`auth-message show ${type}`; }
  function clearAuthMessage() { const box=$('auth-message'); box.textContent=''; box.className='auth-message'; }
  function setStatus(kind, message) { const box=$('connection-status'); if(!box) return; box.className=`connection-status ${kind}`; const icon=kind==='ok'?'bx-check-circle':kind==='error'?'bx-error-circle':'bx-loader-alt bx-spin'; box.innerHTML=`<i class="bx ${icon}"></i><span>${message}</span>`; }
  function text(id,value){const el=$(id);if(el)el.textContent=value;}
  function euro(value){return `${Number(value||0).toFixed(2).replace('.',',')} €`;}
  function message(error){return error?.message||error?.details||error?.hint||'Erreur inconnue';}
  function closeUserMenu(){$('user-menu')?.classList.remove('open');}
  function resetAuthForm(){ $('auth-form')?.reset(); }

  function setAuthMode(signUp){
    state.signingUp=signUp;
    text('auth-subtitle',signUp?'Crée ton compte pour accéder à ton espace privé.':'Connecte-toi pour accéder à ton espace privé.');
    text('auth-submit',signUp?'Créer mon compte':'Se connecter');
    text('auth-switch',signUp?'J’ai déjà un compte':'Créer un compte');
    $('auth-password').setAttribute('autocomplete',signUp?'new-password':'current-password');
    clearAuthMessage();
  }
  function showAuth(){ appShell.hidden=true; authScreen.hidden=false; closeUserMenu(); document.body.classList.remove('menu-open'); }
  function showApp(){ authScreen.hidden=true; appShell.hidden=false; }

  function updateUserUI(){
    const name=state.profile?.pseudo || state.user?.email?.split('@')[0] || 'Utilisateur';
    text('dashboard-user-name',name);text('topbar-user-name',name);text('menu-user-name',name);text('menu-user-email',state.user?.email||'');
    document.querySelectorAll('.user-avatar').forEach(el=>el.textContent=name.charAt(0).toUpperCase());
    $('pf-pseudo').value=state.profile?.pseudo||'';$('pf-societe').value=state.profile?.societe||'';$('pf-adresse').value=state.profile?.adresse||'';$('pf-code-postal').value=state.profile?.code_postal||'';$('pf-ville').value=state.profile?.ville||'';
  }
  async function loadProfile(){
    const {data,error}=await state.db.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
    if(error) throw new Error(`Profil : ${message(error)}`);
    if(data){state.profile=data;return;}
    const initial={id:state.user.id,pseudo:state.user.email?.split('@')[0]||'Utilisateur'};
    const {data:created,error:createError}=await state.db.from('profiles').insert(initial).select().single();
    if(createError) throw new Error(`Création du profil : ${message(createError)}`);
    state.profile=created;
  }
  async function selectAll(table,order){let q=state.db.from(table).select('*');if(order)q=q.order(order);const {data,error}=await q;if(error)throw new Error(`${table} : ${message(error)}`);return data||[];}
  async function loadData(){
    setStatus('loading','Chargement de tes données privées…');
    const [ecuries,cavalieres,concours,factures]=await Promise.all([selectAll('ecuries','nom'),selectAll('cavalieres','nom'),selectAll('concours','date_debut'),selectAll('factures','date_facture')]);
    const paid=factures.filter(f=>String(f.statut_paiement||'').toLowerCase()==='payee');
    const pending=factures.filter(f=>['en_attente','en_retard'].includes(String(f.statut_paiement||'').toLowerCase()));
    const now=new Date();
    const monthly=paid.filter(f=>{const d=new Date(f.date_facture||f.date_creation);return !Number.isNaN(d)&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((sum,f)=>sum+Number(f.montant_total||0),0);
    text('dash-total-ecuries',ecuries.length);text('dash-total-cavalieres',cavalieres.length);text('dash-en-attente',pending.length);text('dash-ca-mois',euro(monthly));
    text('ecuries-summary',`${ecuries.length} écurie(s) chargée(s) pour ton compte.`);text('cavalieres-summary',`${cavalieres.length} cavalière(s) chargée(s) pour ton compte.`);text('concours-summary',`${concours.length} concours chargé(s) pour ton compte.`);text('factures-summary',`${factures.length} facture(s) privée(s) chargée(s).`);
    text('sync-summary',`Connexion réussie : ${ecuries.length} écurie(s), ${cavalieres.length} cavalière(s), ${concours.length} concours et ${factures.length} facture(s) ont été lus pour ton compte.`);
    setStatus('ok','Connecté à Supabase. Tes données privées sont synchronisées.');
  }
  async function signedIn(user){
    state.user=user;showApp();
    try{await loadProfile();updateUserUI();await loadData();}
    catch(error){console.error(error);setStatus('error',`Données indisponibles : ${error.message}`);text('sync-summary','Vérifie les policies RLS et que les lignes existantes ont bien ton user_id.');}
  }
  async function boot(){
    if(!window.supabase||typeof SUPABASE_URL==='undefined'||typeof SUPABASE_ANON_KEY==='undefined'){showAuth();showAuthMessage('config.js ou la bibliothèque Supabase n’est pas chargé.');return;}
    state.db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await state.db.auth.getSession();
    if(session?.user) await signedIn(session.user); else showAuth();
    state.db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){state.user=null;state.profile=null;showAuth();}if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session?.user){setTimeout(()=>signedIn(session.user),0);}});
  }

  $('auth-switch')?.addEventListener('click',()=>setAuthMode(!state.signingUp));
  $('auth-form')?.addEventListener('submit',async event=>{
    event.preventDefault();clearAuthMessage();const email=$('auth-email').value.trim();const password=$('auth-password').value;if(!email||!password)return showAuthMessage('Saisis ton e-mail et ton mot de passe.');
    $('auth-submit').disabled=true;
    try{
      if(state.signingUp){const {data,error}=await state.db.auth.signUp({email,password});if(error)throw error;if(data.session){showAuthMessage('Compte créé et connexion réussie.','ok');}else{showAuthMessage('Compte créé. Vérifie ton e-mail pour confirmer ton inscription.','ok');resetAuthForm();}}
      else {const {error}=await state.db.auth.signInWithPassword({email,password});if(error)throw error;}
    }catch(error){showAuthMessage(message(error));}
    finally{$('auth-submit').disabled=false;}
  });
  document.querySelectorAll('#tabs button[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('#tabs button[data-tab]').forEach(item=>item.classList.remove('active'));document.querySelectorAll('.tab').forEach(item=>item.classList.remove('active'));button.classList.add('active');$(button.dataset.tab)?.classList.add('active');text('page-title',titles[button.dataset.tab]||'ShootnLook');document.body.classList.remove('menu-open');closeUserMenu();}));
  $('sidebar-toggle')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));
  $('sidebar-backdrop')?.addEventListener('click',()=>document.body.classList.remove('menu-open'));
  $('user-toggle')?.addEventListener('click',event=>{event.stopPropagation();$('user-menu')?.classList.toggle('open');});
  document.addEventListener('click',event=>{if(!event.target.closest('.topbar-menu-wrap'))closeUserMenu();});
  const openProfile=()=>{closeUserMenu();$('profile-modal')?.classList.add('visible');};
  $('edit-profile-btn')?.addEventListener('click',openProfile);$('edit-profile-page-btn')?.addEventListener('click',openProfile);$('close-profile-modal')?.addEventListener('click',()=>$('profile-modal')?.classList.remove('visible'));
  $('form-profil')?.addEventListener('submit',async event=>{event.preventDefault();if(!state.user)return;const patch={pseudo:$('pf-pseudo').value.trim(),societe:$('pf-societe').value.trim(),adresse:$('pf-adresse').value.trim(),code_postal:$('pf-code-postal').value.trim(),ville:$('pf-ville').value.trim(),updated_at:new Date().toISOString()};const {data,error}=await state.db.from('profiles').update(patch).eq('id',state.user.id).select().single();if(error){alert(`Impossible d’enregistrer le profil : ${message(error)}`);return;}state.profile=data;updateUserUI();$('profile-modal')?.classList.remove('visible');});
  $('sign-out-btn')?.addEventListener('click',async()=>{closeUserMenu();await state.db.auth.signOut();});
  $('retry-connection')?.addEventListener('click',async()=>{if(state.user)await signedIn(state.user);});
  setAuthMode(false);boot();
});