// src/config/firebase.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdeqmDxbGFq1fDgyUhRc5Xim4ZNF0j-oA",
  authDomain: "zenexistrackingbackend.firebaseapp.com",
  projectId: "zenexistrackingbackend",
  storageBucket: "zenexistrackingbackend.firebasestorage.app",
  messagingSenderId: "20316221532",
  appId: "1:20316221532:web:85c96a5a6bb8a16368b699",
  // measurementId: "G-5B4WEJR47N"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

let firestoreInstance: Firestore;

try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch (error) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

// Add connection settings to help with WebSocket issues
if (typeof window !== 'undefined') {
  // Only run in browser environment
  try {
    // Enable offline persistence for better connection stability
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // Enable network by default
      enableNetwork(db);
    });
  } catch (error) {
    console.warn('Firestore network settings error:', error);
  }
}

export default app;
