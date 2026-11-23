
// Guard: auth callbacks must never crash if the main UI bridge is missing or overwritten.
if(typeof window.getPrincipiaPage!=='function')window.getPrincipiaPage=function(){return 'account';};
if(typeof window.setPrincipiaPage!=='function')window.setPrincipiaPage=function(next){try{localStorage.setItem('principia_pending_page',String(next));}catch(e){}};
/* PRINCIPIA AUTH CONFIG
   1) Tạo Firebase project và bật Authentication > Email/Password + Google.
   2) Dán firebaseConfig lấy từ Firebase Console vào object bên dưới.
   3) Add domain pages.dev của website vào Authentication > Settings > Authorized domains.
*/
window.PRINCIPIA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDk53APfisqBTUnR7zy6vqks9wT9lV9QfI",
  authDomain: "principia-physics-olympiad.firebaseapp.com",
  projectId: "principia-physics-olympiad",
  storageBucket: "principia-physics-olympiad.firebasestorage.app",
  messagingSenderId: "540748984511",
  appId: "1:540748984511:web:a2eaaacc0148dd67a8960a",
  measurementId: "G-4BRDM71BGM"
};
let GOOGLE_AUTH_READY=false;
let principiaAuthActionInProgress=false;
let principiaAuthLastSuccessAt=0;
let principiaAuthInitialStateResolved=false;
let principiaAuthExplicitSignOut=false;
function firebaseConfigured(){return !!(window.PRINCIPIA_FIREBASE_CONFIG && window.PRINCIPIA_FIREBASE_CONFIG.apiKey && !window.PRINCIPIA_FIREBASE_CONFIG.apiKey.startsWith('YOUR_') && window.PRINCIPIA_FIREBASE_CONFIG.projectId && !window.PRINCIPIA_FIREBASE_CONFIG.projectId.startsWith('YOUR_'));}
let principiaFirebaseSdkPromise=null;
function loadPrincipiaFirebaseSdk(){
 if(window.firebase?.auth)return Promise.resolve();
 if(principiaFirebaseSdkPromise)return principiaFirebaseSdkPromise;
 const files=['firebase-app-compat.js','firebase-auth-compat.js'];
 const mirrors=[
  file=>'https://www.gstatic.com/firebasejs/10.12.2/'+file,
  file=>'https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/'+file,
  file=>'https://cdn.jsdelivr.net/npm/firebase@10.12.2/'+file
 ];
 async function loadOneFirebaseFile(file){
  const failures=[];
  for(const makeUrl of mirrors){
   const src=makeUrl(file);
   const alreadyLoaded=[...document.scripts].some(s=>s.src===src&&s.dataset.principiaFirebaseLoaded==='1');
   if(alreadyLoaded)return;
   try{
    await new Promise((resolve,reject)=>{
     const script=document.createElement('script');
     let settled=false;
     const finish=err=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      if(err)reject(err);
      else{script.dataset.principiaFirebaseLoaded='1';resolve();}
     };
     script.onload=()=>finish();
     script.onerror=()=>finish(new Error('Network error: '+src));
     const timer=setTimeout(()=>finish(new Error('Timeout: '+src)),8000);
     script.async=false;
     script.src=src;
     document.head.appendChild(script);
    });
    return;
   }catch(err){failures.push(src+' ('+(err?.message||'load failed')+')');}
  }
  throw new Error('Không tải được Firebase SDK '+file+'. Đã thử các CDN dự phòng: '+failures.join(' ; '));
 }
 principiaFirebaseSdkPromise=(async()=>{
  for(const file of files)await loadOneFirebaseFile(file);
  if(!window.firebase?.auth)throw new Error('Firebase Authentication SDK chưa sẵn sàng.');
 })().catch(err=>{principiaFirebaseSdkPromise=null;throw err;});
 return principiaFirebaseSdkPromise;
}
async function ensureFirebase(){
 if(!firebaseConfigured()) throw new Error('Chưa điền Firebase config vào index.html.');
 await loadPrincipiaFirebaseSdk();
 if(!window.firebase?.apps)throw new Error('Firebase SDK chưa sẵn sàng.');
 if(!firebase.apps.length) firebase.initializeApp(window.PRINCIPIA_FIREBASE_CONFIG);
 return firebase.auth();
}
function getPrincipiaAccount(){
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem('principia_google_account')||'null');}catch(_){}
 let user=null;
 try{if(window.firebase?.apps?.length&&typeof window.firebase.auth==='function')user=window.firebase.auth().currentUser||null;}catch(_){}
 if(user?.uid){
  return {uid:user.uid,name:user.displayName||(saved?.uid===user.uid?saved.name:'')||user.email?.split('@')[0]||'Người dùng',email:user.email||'',customPicture:saved?.uid===user.uid?saved.customPicture||'':'',provider:user.providerData?.[0]?.providerId||'password'};
 }
 if(window.__principiaSessionAccount?.uid)return window.__principiaSessionAccount;
 return saved&&typeof saved==='object'?saved:null;
}
function isPrincipiaOwner(){const a=getPrincipiaAccount();return !!a && a.uid===window.PRINCIPIA_OWNER_UID_PUBLIC && (a.email||'').toLowerCase()===window.PRINCIPIA_OWNER_EMAIL_PUBLIC;}
function principiaRole(){return isPrincipiaOwner()?'admin':'viewer';}
function isPrincipiaAdmin(){return isPrincipiaOwner();}
function canManageContent(){return isPrincipiaOwner();}
function canManageMedia(){return isPrincipiaOwner();}
function requireAdmin(){if(!isPrincipiaOwner()){window.principiaNotify('Chỉ tài khoản admin '+window.PRINCIPIA_OWNER_EMAIL_PUBLIC+' mới được chỉnh sửa.');return false;}return true;}
function requirePermission(){return requireAdmin();}
function getRoleMap(){return {};}
function setGrantedRole(){window.principiaNotify('PRINCIPIA hiện chỉ có 1 tài khoản Admin; các tài khoản còn lại chỉ xem.');}
function revokeGrantedRole(){return;}
function googleStatus(msg){const el=document.getElementById('googleAccountStatus');if(el)el.textContent=msg;}
function openGoogleAccount(){window.setPrincipiaAccountReturnPage(window.getPrincipiaPage()==='account'?window.getPrincipiaAccountReturnPage():window.getPrincipiaPage());window.setPrincipiaPage('account');window.resetPrincipiaStack();window.renderPrincipiaApp();renderGoogleAccount();}
function closeGoogleAccount(){window.navigatePrincipiaPage(window.getPrincipiaAccountReturnPage()||'home');}
function setAccountMode(mode){window.setPrincipiaAccountMode(mode);window.renderPrincipiaApp();renderGoogleAccount();}

function togglePrincipiaPassword(){const input=document.getElementById("authPassword");if(!input)return;const showing=input.type==="password";input.type=showing?"text":"password";const button=input.parentElement?.querySelector("button");if(button){button.textContent=showing?"🙈":"👁";button.setAttribute("aria-label",showing?"Ẩn mật khẩu":"Hiện mật khẩu");button.title=showing?"Ẩn mật khẩu":"Hiện mật khẩu";}}
async function sendPrincipiaPasswordReset(){
 const email=document.getElementById("authEmail")?.value.trim();const status=document.getElementById("emailAuthStatus");
 if(!email){if(status)status.textContent="Bạn hãy nhập email trước, rồi bấm Quên mật khẩu?.";document.getElementById("authEmail")?.focus();return;}
 try{const auth=await ensureFirebase();if(status)status.textContent="Đang gửi email đặt lại mật khẩu…";await auth.sendPasswordResetEmail(email);if(status)status.textContent="Đã gửi email đặt lại mật khẩu. Hãy kiểm tra Hộp thư đến và cả thư rác.";}
 catch(err){const messages={"auth/invalid-email":"Địa chỉ email không hợp lệ.","auth/user-not-found":"Không tìm thấy tài khoản với email này.","auth/too-many-requests":"Bạn thao tác quá nhiều lần. Hãy thử lại sau.","auth/unauthorized-continue-uri":"Cấu hình đường dẫn đặt lại mật khẩu trong Firebase chưa hợp lệ."};if(status)status.textContent=messages[err?.code]||authErrorMessage(err);}
}
function showPrincipiaAuthFeedback(message){
 const text=String(message||'').trim();
 if(!text)return;
 try{if(typeof window.principiaNotify==='function'){window.principiaNotify(text);return;}}catch(error){console.warn('PRINCIPIA notification unavailable:',error);}
 const status=document.getElementById('emailAuthStatus');
 if(status)status.textContent=text;
}
async function submitEmailAuth(event){
 event.preventDefault();
 const form=event.currentTarget;
 const status=document.getElementById('emailAuthStatus');
 const submitButton=form?.querySelector('[type="submit"]');
 const email=document.getElementById('authEmail')?.value.trim()||'';
 const password=document.getElementById('authPassword')?.value||'';
 const name=document.getElementById('authName')?.value.trim()||'';
 const isSignup=window.getPrincipiaAccountMode()==='signup';
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){const message='✕ Địa chỉ email chưa hợp lệ.';if(status)status.textContent=message;showPrincipiaAuthFeedback(message);return;}
 if(password.length<6){const message='✕ Mật khẩu phải có ít nhất 6 ký tự.';if(status)status.textContent=message;showPrincipiaAuthFeedback(message);return;}
 if(principiaAuthActionInProgress)return;
 if(submitButton)submitButton.disabled=true;
 principiaAuthActionInProgress=true;
 let firebaseAuthenticated=false;
 if(status)status.textContent='Đang kết nối và xác thực…';
 try{
  const auth=await ensureFirebase();
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  const cred=isSignup
   ?await auth.createUserWithEmailAndPassword(email,password)
   :await auth.signInWithEmailAndPassword(email,password);
  firebaseAuthenticated=true;
  principiaAuthLastSuccessAt=Date.now();
  principiaAuthInitialStateResolved=true;
  principiaAuthExplicitSignOut=false;
  await syncPrincipiaUser(cred.user);
  let profileWarning=false;
  if(isSignup&&name){
   try{
    await cred.user.updateProfile({displayName:name});
    await syncPrincipiaUser(cred.user);
   }catch(profileError){
    profileWarning=true;
    console.warn('PRINCIPIA: tài khoản đã tạo nhưng chưa cập nhật được tên hiển thị.',profileError);
   }
  }
  showPrincipiaAuthFeedback(profileWarning
   ?'✓ Tài khoản đã được tạo/đăng nhập. Tên hiển thị chưa cập nhật được.'
   :(isSignup?'✓ Đăng ký thành công.':'✓ Đăng nhập thành công.'));
 }catch(err){
  const currentUser=(()=>{try{return window.firebase?.apps?.length?window.firebase.auth().currentUser:null;}catch(_){return null;}})();
  if(firebaseAuthenticated||currentUser){
   if(currentUser){
    try{await syncPrincipiaUser(currentUser);}
    catch(syncError){console.error('PRINCIPIA: Firebase authenticated but app sync failed.',syncError);}
   }
   const message='✓ Firebase đã xác thực tài khoản, nhưng ứng dụng gặp lỗi khi đồng bộ: '+(err?.message||'lỗi không xác định');
   console.error('PRINCIPIA post-authentication error:',err);
   showPrincipiaAuthFeedback(message);
   return;
  }
  const message='✕ '+authErrorMessage(err)+(err?.code?' ['+err.code+']':'');
  if(status)status.textContent=message;
  showPrincipiaAuthFeedback(message);
  if(typeof window.principiaCompanionReact==='function')window.principiaCompanionReact('wrong',authErrorMessage(err));
 }finally{
  principiaAuthActionInProgress=false;
  if(submitButton)submitButton.disabled=false;
 }
}
function authErrorMessage(err){const map={'auth/email-already-in-use':'Email này đã được đăng ký. Hãy đăng nhập.','auth/invalid-credential':'Email hoặc mật khẩu không chính xác.','auth/invalid-login-credentials':'Email hoặc mật khẩu không chính xác.','auth/weak-password':'Mật khẩu cần ít nhất 6 ký tự.','auth/invalid-email':'Địa chỉ email không hợp lệ.','auth/popup-closed-by-user':'Bạn đã đóng cửa sổ đăng nhập.','auth/unauthorized-domain':'Domain website chưa được thêm vào Authorized domains trong Firebase.','auth/operation-not-allowed':'Firebase chưa bật phương thức đăng nhập Email/Password hoặc Google.','auth/network-request-failed':'Không kết nối được Firebase. Kiểm tra mạng và thử lại.','auth/too-many-requests':'Bạn thao tác quá nhiều lần. Hãy thử lại sau.','auth/user-disabled':'Tài khoản này đã bị vô hiệu hóa.','auth/missing-password':'Bạn chưa nhập mật khẩu.','auth/invalid-api-key':'Firebase API key không hợp lệ.'};return map[err?.code]||err?.message||'Không thể xác thực tài khoản.';}
async function syncPrincipiaUser(user){
 if(!user)return;
 const previous=getPrincipiaAccount();
 const returningAccount=previous?.uid===user.uid;
 const account={
  uid:user.uid,
  name:user.displayName||user.email?.split('@')[0]||'Người dùng',
  email:user.email||'',
  customPicture:returningAccount?previous.customPicture||'':'',
  signedInAt:new Date().toISOString(),
  provider:user.providerData?.[0]?.providerId||'password'
 };
 window.__principiaSessionAccount=account;
 try{
  localStorage.setItem('principia_google_account',JSON.stringify(account));
  const appProfile=JSON.parse(localStorage.getItem('halo_profile')||'{}');
  appProfile.name=account.name;
  appProfile.avatar='';
  localStorage.setItem('halo_profile',JSON.stringify(appProfile));
 }catch(storageError){
  console.warn('PRINCIPIA: không lưu được hồ sơ cục bộ; vẫn giữ phiên Firebase.',storageError);
 }
 const welcomeKey='principia_welcome_seen_v6_'+(account.uid||account.email||'guest');
 let welcomeSeen=false;
 try{welcomeSeen=localStorage.getItem(welcomeKey)==='1';}catch(_){}
 if(!welcomeSeen)window.setPrincipiaPage('welcome');
 else if(window.getPrincipiaPage()==='account')window.setPrincipiaPage('home');
 window.renderPrincipiaApp();
 if(window.watchPrincipiaLeaderboard)window.watchPrincipiaLeaderboard();
 if(window.syncPrincipiaLeaderboard)window.syncPrincipiaLeaderboard();
}
async function signInWithGoogle(){
 if(principiaAuthActionInProgress)return;
 principiaAuthActionInProgress=true;
 try{
  const auth=await ensureFirebase();
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  const provider=new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  if(!window.principiaDesktop){
   googleStatus('Đang chuyển đến Google để xác thực…');
   await auth.signInWithRedirect(provider);
   return;
  }
  const cred=await auth.signInWithPopup(provider);
  principiaAuthLastSuccessAt=Date.now();
  principiaAuthInitialStateResolved=true;
  principiaAuthExplicitSignOut=false;
  await syncPrincipiaUser(cred.user);
  window.principiaNotify?.('✓ Đăng nhập Google thành công.');
 }catch(err){
  const message=authErrorMessage(err)+(err?.code?' ['+err.code+']':'');
  console.error('PRINCIPIA Google sign-in failed:',err);
  googleStatus('✕ '+message);
  window.principiaNotify?.('✕ Đăng nhập Google thất bại: '+message);
  if(typeof window.principiaCompanionReact==='function')window.principiaCompanionReact('wrong',message+' Thử lại nhé!');
 }finally{
  principiaAuthActionInProgress=false;
 }
}
function renderGoogleAccount(){const mount=document.getElementById('googleSignInButton');if(!mount)return;mount.innerHTML='';if(getPrincipiaAccount())return;mount.innerHTML=`<button type="button" class="google-login-fallback" onclick="signInWithGoogle()"><span aria-hidden="true">G</span> ${window.getPrincipiaAccountMode()==='signup'?'Đăng ký':'Đăng nhập'} bằng Google</button>`;if(!firebaseConfigured())googleStatus('Cần cấu hình Firebase để bật cả Google và email/mật khẩu.');else googleStatus('Đăng nhập Google qua Firebase.');}
function googleSetupNotice(){signInWithGoogle();}
function saveGoogleClientId(){googleStatus('Không cần Google Client ID riêng. Hãy bật Google provider trong Firebase Authentication.');}
function escapeAccountText(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function changeAccountAvatar(file){if(!file)return;if(!file.type.startsWith('image/')){window.principiaNotify('Vui lòng chọn tệp ảnh');return;}if(file.size>4*1024*1024){window.principiaNotify('Ảnh tối đa 4 MB');return;}const reader=new FileReader();reader.onload=()=>{const acc=getPrincipiaAccount();if(!acc)return;acc.customPicture=reader.result;localStorage.setItem('principia_google_account',JSON.stringify(acc));window.renderPrincipiaApp();window.principiaNotify('Đã cập nhật ảnh đại diện');};reader.readAsDataURL(file);}
function resetAccountAvatar(){const acc=getPrincipiaAccount();if(!acc)return;delete acc.customPicture;localStorage.setItem('principia_google_account',JSON.stringify(acc));window.renderPrincipiaApp();}
function openYoutubeWithGoogle(){const acc=getPrincipiaAccount();window.open(acc?.email?'https://www.youtube.com/?authuser='+encodeURIComponent(acc.email):'https://www.youtube.com/','_blank','noopener');}
async function signOutGoogleLocal(){
 principiaAuthExplicitSignOut=true;
 try{if(firebase.apps.length)await firebase.auth().signOut();}
 catch(error){console.error('PRINCIPIA sign-out failed:',error);principiaAuthExplicitSignOut=false;googleStatus('Không thể đăng xuất: '+authErrorMessage(error));return;}
 try{localStorage.removeItem('principia_google_account');}catch(_){}
 window.__principiaSessionAccount=null;
 try{const appProfile=JSON.parse(localStorage.getItem('halo_profile')||'{}');appProfile.name='Learner';appProfile.avatar='';localStorage.setItem('halo_profile',JSON.stringify(appProfile));}catch(_){}
 window.setPrincipiaPage('account');window.setPrincipiaAccountMode('login');window.renderPrincipiaApp();renderGoogleAccount();
}
async function initPrincipiaAuth(){
 if(!firebaseConfigured()){
  if(window.getPrincipiaPage()!=='account'&&!getPrincipiaAccount()){window.setPrincipiaPage('account');window.renderPrincipiaApp();}
  return;
 }
 try{
  const auth=await ensureFirebase();
  auth.onAuthStateChanged(async user=>{
   if(user){
    principiaAuthInitialStateResolved=true;
    principiaAuthExplicitSignOut=false;
    try{await syncPrincipiaUser(user);}
    catch(error){console.error('PRINCIPIA auth session sync:',error);googleStatus('Đã xác thực Firebase nhưng lỗi khi mở ứng dụng: '+(error?.message||'lỗi không xác định'));}
    return;
   }
   if(!principiaAuthInitialStateResolved){
    principiaAuthInitialStateResolved=true;
    if(principiaAuthActionInProgress)return;
    try{localStorage.removeItem('principia_google_account');}catch(_){}
    window.__principiaSessionAccount=null;
    if(window.getPrincipiaPage()!=='account'){window.setPrincipiaPage('account');window.resetPrincipiaStack();window.renderPrincipiaApp();}
    renderGoogleAccount();
    return;
   }
   if(principiaAuthExplicitSignOut)return;
   // Ignore subsequent null events: only an explicit sign-out action may end the app session.
  });
  try{
   const redirectResult=await auth.getRedirectResult();
   if(redirectResult?.user){
    principiaAuthLastSuccessAt=Date.now();
    principiaAuthInitialStateResolved=true;
    principiaAuthExplicitSignOut=false;
    await syncPrincipiaUser(redirectResult.user);
    window.principiaNotify?.('✓ Đăng nhập Google thành công.');
   }
  }catch(redirectError){
   const message=authErrorMessage(redirectError)+(redirectError?.code?' ['+redirectError.code+']':'');
   console.error('PRINCIPIA Google redirect result failed:',redirectError);
   googleStatus('✕ Đăng nhập Google thất bại: '+message);
   window.principiaNotify?.('✕ Đăng nhập Google thất bại: '+message);
  }
 }catch(error){
  console.error('PRINCIPIA auth init:',error);
  const status=document.getElementById('googleAccountStatus');
  if(status)status.textContent='Lỗi Firebase: '+(error?.message||String(error));
  window.principiaAuthInitError=error?.message||String(error);
 }
}
document.addEventListener('DOMContentLoaded',()=>{initPrincipiaAuth();if(window.getPrincipiaPage()==='account')renderGoogleAccount();});
window.addEventListener('beforeunload',e=>{if(window.isPrincipiaQuizInProgress()) {e.preventDefault();e.returnValue='Bài làm chưa hoàn thành.';}});


/* PRINCIPIA shared academic leaderboard */
window.principiaLeaderboardRows=[];
window.principiaLeaderboardError='';
let principiaLeaderboardUnsubscribe=null,principiaLeaderboardSyncTimer=null;
let principiaFirestoreSdkPromise=null;
function loadPrincipiaFirestoreSdk(){
 if(window.firebase?.firestore)return Promise.resolve();
 if(principiaFirestoreSdkPromise)return principiaFirestoreSdkPromise;
 const urls=[
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@10.12.2/firebase-firestore-compat.js'
 ];
 principiaFirestoreSdkPromise=(async()=>{
  let lastError;
  for(const src of urls){
   try{
    await new Promise((resolve,reject)=>{
     const script=document.createElement('script');
     const timer=setTimeout(()=>reject(new Error('Timeout: '+src)),8000);
     script.onload=()=>{clearTimeout(timer);resolve();};
     script.onerror=()=>{clearTimeout(timer);reject(new Error('Network error: '+src));};
     script.src=src;script.async=false;document.head.appendChild(script);
    });
    if(window.firebase?.firestore)return;
   }catch(error){lastError=error;}
  }
  throw lastError||new Error('Không tải được Firestore SDK.');
 })().catch(error=>{principiaFirestoreSdkPromise=null;throw error;});
 return principiaFirestoreSdkPromise;
}

async function principiaLeaderboardDb(){
 await loadPrincipiaFirestoreSdk();
 if(!firebaseConfigured()||!window.firebase?.firestore)throw new Error('Firestore SDK chưa sẵn sàng');
 if(!firebase.apps.length)firebase.initializeApp(window.PRINCIPIA_FIREBASE_CONFIG);
 return firebase.firestore();
}
window.syncPrincipiaLeaderboard=function(){
 const acc=getPrincipiaAccount();if(!acc?.uid)return;
 clearTimeout(principiaLeaderboardSyncTimer);
 principiaLeaderboardSyncTimer=setTimeout(async()=>{
  try{
   const db=await principiaLeaderboardDb();
   const stats=window.getPrincipiaStats();
   await db.collection('principiaLeaderboard').doc(acc.uid).set({
    uid:acc.uid,name:String(acc.name||stats.name||'Học sinh').slice(0,60),
    xp:stats.xp,streak:stats.streak,
    completedCount:stats.completedCount,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
   },{merge:true});
  }catch(e){window.principiaLeaderboardError=e?.code||e?.message||'Firestore write failed';}
 },500);
};
window.watchPrincipiaLeaderboard=async function(){
 const acc=getPrincipiaAccount();if(!acc?.uid)return;
 if(principiaLeaderboardUnsubscribe)return;
 try{
  const db=principiaLeaderboardDb();
  principiaLeaderboardUnsubscribe=db.collection('principiaLeaderboard').orderBy('xp','desc').limit(50).onSnapshot(snap=>{
   window.principiaLeaderboardRows=snap.docs.map(d=>d.data()).filter(x=>x&&x.uid);
   window.principiaLeaderboardError='';
   window.renderPrincipiaLeaderboardRows(window.principiaLeaderboardRows,acc.uid);
  },err=>{window.principiaLeaderboardError=err?.code||err?.message||'Firestore read failed';});
 }catch(e){window.principiaLeaderboardError=e?.message||'Firestore unavailable';}
};

// Khởi động sau khi Firebase và các hàm xác thực đã được khai báo.
window.applyPrincipiaThemePublic(localStorage.getItem('principia_theme')||'dark');
window.renderPrincipiaApp();

