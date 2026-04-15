import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBnJp3vCnH5XQrqEOrde6SUfNuanVz3VUs',
  authDomain: 'brotato-58277.firebaseapp.com',
  databaseURL: 'https://brotato-58277-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'brotato-58277',
  storageBucket: 'brotato-58277.firebasestorage.app',
  messagingSenderId: '196362099874',
  appId: '1:196362099874:web:25be5e15544455c24d4bfb',
  measurementId: 'G-S68XXPV5QT'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
