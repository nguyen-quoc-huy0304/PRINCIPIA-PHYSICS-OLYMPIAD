import type { FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDk53APfisqBTUnR7zy6vqks9wT9lV9QfI',
  authDomain: 'principia-physics-olympiad.firebaseapp.com',
  projectId: 'principia-physics-olympiad',
  storageBucket: 'principia-physics-olympiad.firebasestorage.app',
  messagingSenderId: '540748984511',
  appId: '1:540748984511:web:a2eaaacc0148dd67a8960a',
  measurementId: 'G-4BRDM71BGM'
};

let appPromise: Promise<FirebaseApp> | undefined;

export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ getApps, initializeApp }) => {
      return getApps()[0] ?? initializeApp(firebaseConfig);
    }).catch(error => {
      appPromise = undefined;
      throw error;
    });
  }
  return appPromise;
}

export const PRINCIPIA_ADMIN_EMAIL = 'huyquocnguyen03042011@gmail.com';
