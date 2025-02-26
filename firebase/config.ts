// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  initializeAuth,
  Auth,
} from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { getFirestore, Firestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from "@env";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

console.log("Firebase Config:", firebaseConfig); // Debug log

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência nativa
let auth: Auth;
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

const db: Firestore = getFirestore(app);

export { auth, db };
