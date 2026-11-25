/**
 * Firebase Web Configuration for AstroBit Google Sign-In + Firestore Cloud Sync.
 * Public Web App identifiers (security is enforced server-side by Firestore Rules:
 * `match /users/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }`).
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBjvb2W4eIkncCNkQzK9Z8-jPbrhZ5GmPU',
  authDomain: 'astrobit-game.firebaseapp.com',
  projectId: 'astrobit-game',
  storageBucket: 'astrobit-game.firebasestorage.app',
  messagingSenderId: '210068348816',
  appId: '1:210068348816:web:f66e13e790b8eda5cf1d15',
};
