/**
 * AstroBit Optional Google Cloud Sync Adapter (Firebase Auth + Firestore Modular CDN).
 * Zero impact when FIREBASE_CONFIG is null; dynamically imports official Firebase ESM modules
 * only when configured, keeping offline/local play 100% instant and dependency-free.
 */

import { FIREBASE_CONFIG } from './firebase-config.js?v=6.9';

let cachedSdk = null;
let currentUser = null;

export function isGoogleCloudConfigured() {
  return Boolean(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

export function getCurrentGoogleUser() {
  return currentUser;
}

async function loadFirebaseSdk() {
  if (!isGoogleCloudConfigured()) return null;
  if (cachedSdk) return cachedSdk;

  const appMod = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js');
  const authMod = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
  const fsMod = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js');

  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);

  cachedSdk = { auth, db, authMod, fsMod };
  return cachedSdk;
}

export async function signInWithGoogle() {
  const sdk = await loadFirebaseSdk();
  if (!sdk) return { ok: false, reason: 'not_configured' };
  const provider = new sdk.authMod.GoogleAuthProvider();
  const cred = await sdk.authMod.signInWithPopup(sdk.auth, provider);
  currentUser = {
    uid: cred.user.uid,
    displayName: cred.user.displayName || '',
    photoURL: cred.user.photoURL || '',
    email: cred.user.email || '',
  };
  return { ok: true, user: currentUser };
}

export async function signOutGoogle() {
  const sdk = await loadFirebaseSdk();
  if (sdk) {
    await sdk.authMod.signOut(sdk.auth);
  }
  currentUser = null;
}

export async function loadCloudProgress(uid) {
  const sdk = await loadFirebaseSdk();
  if (!sdk || !uid) return null;
  const ref = sdk.fsMod.doc(sdk.db, 'users', uid);
  const snap = await sdk.fsMod.getDoc(ref);
  return snap.exists() ? snap.data()?.progress || null : null;
}

export async function saveCloudProgress(uid, progress) {
  const sdk = await loadFirebaseSdk();
  if (!sdk || !uid) return false;
  const ref = sdk.fsMod.doc(sdk.db, 'users', uid);
  await sdk.fsMod.setDoc(
    ref,
    { progress, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return true;
}

export async function publishLeaderboardEntry(uid, entry) {
  const sdk = await loadFirebaseSdk();
  if (!sdk || !uid || !entry) return false;
  try {
    const ref = sdk.fsMod.doc(sdk.db, 'leaderboard', uid);
    await sdk.fsMod.setDoc(ref, entry, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function fetchGlobalLeaderboard(limitCount = 20) {
  const sdk = await loadFirebaseSdk();
  if (!sdk) return [];
  try {
    const colRef = sdk.fsMod.collection(sdk.db, 'leaderboard');
    const q = sdk.fsMod.query(
      colRef,
      sdk.fsMod.orderBy('xp', 'desc'),
      sdk.fsMod.limit(limitCount)
    );
    const snap = await sdk.fsMod.getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/**
 * Restores an existing Google session silently on page load if the user already signed in.
 */
export async function watchGoogleAuthSession(onUserChange) {
  const sdk = await loadFirebaseSdk();
  if (!sdk) return () => {};
  return sdk.authMod.onAuthStateChanged(sdk.auth, (user) => {
    currentUser = user
      ? {
          uid: user.uid,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          email: user.email || '',
        }
      : null;
    onUserChange?.(currentUser);
  });
}
