import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCqYd0jEalHKO7xH5zvS9_zavr7GA-FyjU",
    authDomain: "ledger-butler.firebaseapp.com",
    projectId: "ledger-butler",
    storageBucket: "ledger-butler.firebasestorage.app",
    messagingSenderId: "622793086532",
    appId: "1:622793086532:web:7004d269aadd490616ce11",
    measurementId: "G-TH05DSNHES"
  };

// 摰儔霈
let app;
let auth: Auth | undefined;
let db: Firestore | undefined;
let functions: Functions | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let isMockMode = false;

try {
  // 1. ?岫????Firebase (Modular Syntax - Named Import)
  // Use namespace import to avoid TypeScript error 'Module has no exported member initializeApp'
  app = firebaseApp.initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  googleProvider = new GoogleAuthProvider();
  
  console.log("??Firebase ????岫??");

} catch (error) {
  // 2. 憒??葡 Key ?⊥?雿輻 (靘?撠?銝??具ey ?航炊?雯頝臭???
  // 蝔??歲?圈ㄐ嚗蒂?芸????芋?祆芋撘?  console.warn("?? Firebase ???憭望?嚗ey ?航?⊥??身摰隤扎?, error);
  console.log("?? ????[璅⊥璅∪?] (Mock Mode)");
  
  isMockMode = true;
}

const enableMockMode = () => {
  isMockMode = true;
  console.log("?? ??????[璅⊥璅∪?] (Mock Mode)");
};

export { app, auth, db, functions, googleProvider, isMockMode, enableMockMode };
