import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCqYd0jEalHKO7xH5zvS9_zavr7GA-FyjU",
  authDomain: "ledger-butler.firebaseapp.com",
  projectId: "ledger-butler",
  storageBucket: "ledger-butler.firebasestorage.app",
  messagingSenderId: "622793086532",
  appId: "1:622793086532:web:7004d269aadd490616ce11",
  measurementId: "G-TH05DSNHES"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions: Functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

export { auth, functions, googleProvider };
