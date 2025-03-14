// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  type Auth as FirebaseAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

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

// Log para verificar se as variáveis de ambiente estão sendo carregadas
console.log(
  "Firebase API Key:",
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "Definida" : "Não definida"
);
console.log(
  "Firebase Project ID:",
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "Definido" : "Não definido"
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
let auth: FirebaseAuth = getAuth(app);

// No React Native, não precisamos definir persistência explicitamente
// O Firebase Web SDK no React Native usa uma persistência em memória por padrão
// Vamos usar AsyncStorage para armazenar o token de autenticação manualmente
console.log("Auth inicializado com sucesso");

const db = getFirestore(app);

export { auth, db };
