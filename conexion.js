/* ===== Conexión con Supabase (reemplaza el guardado de Claude) ===== */
(function(){
const CFG=window.FRASCOS_CONFIG||{};const T='frascos_docs';
let sb=null,user=null,listo,ready=new Promise(r=>listo=r);
const rid=()=>{const c='abcdefghijklmnopqrstuvwxyz0123456789',a=crypto.getRandomValues(new Uint8Array(20));let s='';for(const b of a)s+=c[b%36];return s};
const cache={},loaded={},loading={},colL={},docL={};
const err=e=>{const m=(e&&e.message)||String(e);return{code:/JWT|auth|permission|policy|row-level|401|403/i.test(m)?'invalid_argument':'unavailable',message:m}};
async function load(col,force){if(loaded[col]&&!force)return;if(loading[col])return loading[col];
  loading[col]=(async()=>{const map=new Map();for(let from=0;;from+=1000){const {data,error}=await sb.from(T).select('id,data').eq('col',col).range(from,from+999);if(error)throw err(error);for(const r of data)map.set(r.id,r.data);if(data.length<1000)break}cache[col]=map;loaded[col]=true})();
  try{await loading[col]}finally{loading[col]=null}}
const snap=col=>{const docs=[...(cache[col]||new Map()).entries()].map(([id,d])=>({id,exists:true,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}}));return{docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}}};
const dsnap=(col,id)=>{const d=cache[col]&&cache[col].get(id);return{id,exists:!!d,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}}};
function emit(col,id){(colL[col]||new Set()).forEach(f=>f(snap(col)));const k=col+'/'+id;(docL[k]||new Set()).forEach(f=>f(dsnap(col,id)))}
function emitAll(col){(colL[col]||new Set()).forEach(f=>f(snap(col)));for(const k in docL)if(k.startsWith(col+'/'))docL[k].forEach(f=>f(dsnap(col,k.slice(col.length+1))))}
function merge(a,b){const o=Object.assign({},a);for(const k in b){const v=b[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))o[k]=merge(o[k],v);else o[k]=v}return o}
async function put(col,id,data){const {error}=await sb.from(T).upsert({user_id:user.id,col,id,data,updated_at:new Date().toISOString()},{onConflict:'user_id,col,id'});if(error)throw err(error);(cache[col]=cache[col]||new Map()).set(id,data);emit(col,id)}
function docRef(col,id){return{id,path:col+'/'+id,
  get:async()=>{await load(col);return dsnap(col,id)},
  set:async d=>put(col,id,JSON.parse(JSON.stringify(d))),
  update:async p=>{await load(col);const cur=cache[col].get(id);if(!cur)throw{code:'invalid_argument',message:'No existe'};return put(col,id,merge(cur,JSON.parse(JSON.stringify(p))))},
  delete:async()=>{const {error}=await sb.from(T).delete().eq('col',col).eq('id',id);if(error)throw err(error);cache[col]&&cache[col].delete(id);emit(col,id)},
  onSnapshot:(next,onErr)=>{const k=col+'/'+id;(docL[k]=docL[k]||new Set()).add(next);load(col).then(()=>next(dsnap(col,id)),e=>onErr&&onErr(e));return()=>docL[k].delete(next)}}}
function colRef(col){return{path:col,doc:id=>docRef(col,id||rid()),add:async d=>{const r=docRef(col,rid());await r.set(d);return r},
  get:async()=>{await load(col);return snap(col)},
  onSnapshot:(next,onErr)=>{(colL[col]=colL[col]||new Set()).add(next);load(col).then(()=>next(snap(col)),e=>onErr&&onErr(e));return()=>colL[col].delete(next)}}}
const db={collection:p=>colRef(p),doc:p=>{const [c,i]=p.split('/');return docRef(c,i)}};
async function refrescar(){for(const col of Object.keys(loaded)){try{await load(col,true);emitAll(col)}catch(_){}}}
function enVivo(){try{sb.channel('frascos-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:T,filter:'user_id=eq.'+user.id},pl=>{
    if(pl.eventType==='DELETE'){const o=pl.old||{};if(o.col&&cache[o.col]){cache[o.col].delete(o.id);emit(o.col,o.id)}else refrescar();return}
    const r=pl.new;if(!r||!r.col)return;(cache[r.col]=cache[r.col]||new Map()).set(r.id,r.data);emit(r.col,r.id)}).subscribe()}catch(_){}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refrescar()});setInterval(()=>{if(!document.hidden)refrescar()},60000)}
const downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);return{status:'saved'}}};
window.claude={use:async n=>n==='downloads'?downloads:n==='db'?(await ready,db):null};
window.cerrarSesion=async()=>{try{await sb.auth.signOut()}catch(_){}location.reload()};

/* ----- pantalla de ingreso ----- */
const L=document.getElementById('login');
const msg=(t,bad)=>{const m=document.getElementById('lg-msg');m.textContent=t;m.style.color=bad?'var(--bad)':'var(--muted)'};
function entrar(u){user=u;window.__email=u.email||'';L.hidden=true;document.getElementById('lg-user')&&(document.getElementById('lg-user').textContent=u.email||'');enVivo();listo()}
async function iniciar(){
  if(!window.supabase||!CFG.url||!CFG.anonKey||/PEGAR/.test(CFG.anonKey)){L.hidden=false;msg('Falta configurar la conexión: completá url y anonKey en config.js y volvé a subir los archivos.',true);document.getElementById('lg-form').hidden=true;return}
  sb=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
  const {data}=await sb.auth.getSession();if(data&&data.session){entrar(data.session.user);return}
  L.hidden=false;
  const f=document.getElementById('lg-form');let modo='entrar';
  document.getElementById('lg-alt').onclick=()=>{modo=modo==='entrar'?'crear':'entrar';document.getElementById('lg-go').textContent=modo==='entrar'?'Entrar':'Crear cuenta';document.getElementById('lg-alt').textContent=modo==='entrar'?'Es mi primera vez: crear cuenta':'Ya tengo cuenta: entrar';msg('')};
  f.onsubmit=async e=>{e.preventDefault();const em=document.getElementById('lg-email').value.trim(),pw=document.getElementById('lg-pass').value;const b=document.getElementById('lg-go');b.disabled=true;msg(modo==='entrar'?'Entrando…':'Creando cuenta…');
    try{if(modo==='entrar'){const {data,error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)throw error;entrar(data.user)}
      else{const {data,error}=await sb.auth.signUp({email:em,password:pw});if(error)throw error;if(data.session)entrar(data.user);else{msg('Cuenta creada. Revisá tu mail y confirmá la cuenta; después volvé y tocá Entrar.');modo='crear';document.getElementById('lg-alt').click()}}}
    catch(er){const m=String(er&&er.message||er);msg(/Invalid login/i.test(m)?'Mail o contraseña incorrectos.':/not confirmed/i.test(m)?'Todavía no confirmaste el mail. Revisá tu casilla.':/at least 6/i.test(m)?'La contraseña tiene que tener al menos 6 caracteres.':/already registered/i.test(m)?'Ese mail ya tiene cuenta: tocá "Ya tengo cuenta".':'No se pudo: '+m,true)}
    finally{b.disabled=false}}}
iniciar();
})();
