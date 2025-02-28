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

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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
