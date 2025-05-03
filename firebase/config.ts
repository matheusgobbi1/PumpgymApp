// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  type Auth as FirebaseAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração direta do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCk87hePbNfLt5xlEBbMMJvUVxGLWpsMBc",
  authDomain: "pumpgym-93f15.firebaseapp.com",
  projectId: "pumpgym-93f15",
  storageBucket: "pumpgym-93f15.firebasestorage.app",
  messagingSenderId: "254079440927",
  appId: "1:254079440927:web:1b7055f8450d98ee839d2a",
  measurementId: "G-15HR39ZP92",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
let auth: FirebaseAuth = getAuth(app);


const db = getFirestore(app);

export { auth, db };
