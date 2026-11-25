/**
 * Optional Firebase Web Configuration for Google Sign-In + Firestore Cloud Sync.
 * Leave as `null` for 100% local-only GitHub Pages mode (localStorage + JSON Backup).
 *
 * To activate Google Sign-In & Cloud Sync:
 *  1. Create a free Spark project at https://console.firebase.google.com/
 *  2. Enable Authentication -> Google provider, and add `lucasvalequeiroz.github.io` to Authorized Domains.
 *  3. Enable Firestore Database with rule:
 *       match /users/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
 *  4. Paste your public Web App config object below instead of `null`.
 */
export const FIREBASE_CONFIG = null;
