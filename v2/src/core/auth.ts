import type { User } from 'firebase/auth';
import { getFirebaseApp, PRINCIPIA_ADMIN_EMAIL } from './firebase';

export type AuthResult = { user: User; isAdmin: boolean };

function toResult(user: User): AuthResult {
  return {
    user,
    // UI hint only. Firestore Security Rules must enforce all write permissions.
    isAdmin: user.emailVerified && (user.email ?? '').toLowerCase() === PRINCIPIA_ADMIN_EMAIL
  };
}

export async function observeAuth(callback: (result: AuthResult | null) => void) {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  return authSdk.onAuthStateChanged(authSdk.getAuth(app), user => {
    callback(user ? toResult(user) : null);
  });
}

export async function completeGoogleRedirect(): Promise<AuthResult | null> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  const result = await authSdk.getRedirectResult(authSdk.getAuth(app));
  return result?.user ? toResult(result.user) : null;
}

export async function signInWithGoogle(): Promise<void> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  const auth = authSdk.getAuth(app);
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await authSdk.signInWithRedirect(auth, provider);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  const result = await authSdk.signInWithEmailAndPassword(authSdk.getAuth(app), email.trim(), password);
  return toResult(result.user);
}

export async function createEmailAccount(email: string, password: string, displayName: string): Promise<AuthResult> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  const result = await authSdk.createUserWithEmailAndPassword(authSdk.getAuth(app), email.trim(), password);
  if (displayName.trim()) await authSdk.updateProfile(result.user, { displayName: displayName.trim() });
  return toResult(result.user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  await authSdk.sendPasswordResetEmail(authSdk.getAuth(app), email.trim());
}

export async function signOut(): Promise<void> {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth')
  ]);
  await authSdk.signOut(authSdk.getAuth(app));
}


export async function updateDisplayName(name: string): Promise<AuthResult> {
  const [app, authSdk] = await Promise.all([getFirebaseApp(), import('firebase/auth')]);
  const user = authSdk.getAuth(app).currentUser;
  if (!user) throw new Error('Bạn cần đăng nhập trước khi cập nhật hồ sơ.');
  await authSdk.updateProfile(user, { displayName: name.trim() });
  return toResult(user);
}
