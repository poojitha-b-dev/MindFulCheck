import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA11JaEBc67T0FFK1JZcU4wXBOFKsR9RiE",
  authDomain: "mindfulcheck-79a3c.firebaseapp.com",
  projectId: "mindfulcheck-79a3c",
  storageBucket: "mindfulcheck-79a3c.firebasestorage.app",
  messagingSenderId: "499379417028",
  appId: "1:499379417028:web:ff0b5bfbbc0db5d4383e91"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
