import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpXnj2-faNOJyuMavqIzjwKaxYtjceo0w",
  authDomain: "promet-f4543.firebaseapp.com",
  projectId: "promet-f4543",
  storageBucket: "promet-f4543.firebasestorage.app",
  messagingSenderId: "934380870536",
  appId: "1:934380870536:web:a519fbf144b172ecd9783d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
