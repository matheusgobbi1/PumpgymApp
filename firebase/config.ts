// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  initializeAuth,
  type Auth as FirebaseAuth,
} from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_CONFIG } from "../constants/FirebaseConfig";

// Configuração do Firebase
const firebaseConfig = FIREBASE_CONFIG;

console.log("Firebase Config:", firebaseConfig); // Debug log

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência nativa
let auth: FirebaseAuth;
try {
  // Tentar usar initializeAuth com persistência
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("Auth inicializado com sucesso"); // Debug log
} catch (error) {
  // Se já inicializado, usar getAuth
  console.log("Erro na inicialização do auth:", error); // Debug log
  auth = getAuth(app);

  // Tentar definir persistência mesmo assim
  try {
    setPersistence(auth, browserLocalPersistence);
  } catch (persistenceError) {
    console.log("Erro ao definir persistência:", persistenceError);
  }
}

const db = getFirestore(app);

export { auth, db };
