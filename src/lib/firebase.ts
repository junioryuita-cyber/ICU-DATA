import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target database ID specified in project config
const dbId = firebaseConfigJson.firestoreDatabaseId || '(default)';

let db: Firestore;
try {
  if (dbId && dbId !== '(default)') {
    db = getFirestore(app, dbId);
  } else {
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Initializing default firestore fallback:', err);
  db = getFirestore(app);
}

export { app, db, dbId };
