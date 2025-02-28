import React, { createContext, useState, useContext, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  getIdToken,
  signInAnonymously as signInAnonymouslyFirebase,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  type User as FirebaseUser,
  type Auth as FirebaseAuth,
  type AuthError as FirebaseAuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useRouter } from "expo-router";
import {
  saveUserData,
  getUserData,
  removeUserData,
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
} from "../firebase/storage";
import { OfflineStorage } from "../services/OfflineStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Garantir que auth é do tipo FirebaseAuth
const firebaseAuth: FirebaseAuth = auth;

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isNewUser: boolean;
  isAnonymous: boolean;
  checkEmailStatus: (
    email: string
  ) => Promise<{ exists: boolean; onboardingCompleted: boolean }>;
  restoreSession: () => Promise<boolean>;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  sessionRestoreAttempted: boolean;
  signInAnonymously: () => Promise<FirebaseUser>;
  completeAnonymousRegistration: (
    name: string,
    email: string,
    password: string
  ) => Promise<FirebaseUser>;
  registrationCompleted: boolean;
  notifyRegistrationCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionRestoreAttempted, setSessionRestoreAttempted] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const router = useRouter();

  const notifyRegistrationCompleted = () => {
    setRegistrationCompleted(true);
    // Reset após um curto delay para permitir que outros componentes reajam
    setTimeout(() => setRegistrationCompleted(false), 1000);
  };

  // Função para tentar restaurar a sessão do usuário
  const restoreSession = async (): Promise<boolean> => {
    try {
      // Marcar que tentamos restaurar a sessão
      setSessionRestoreAttempted(true);

      // Se já temos um usuário autenticado, não precisamos restaurar a sessão
      if (auth.currentUser) {
        console.log(
          "Usuário já está autenticado, não precisa restaurar sessão"
        );
        setUser(auth.currentUser);
        setIsAnonymous(auth.currentUser.isAnonymous);
        setSessionRestored(true);
        setLoading(false);
        return true;
      }

      // Verificar se há dados do usuário e token armazenados
      const userData = await getUserData();
      const authToken = await getAuthToken();

      console.log(
        "Verificando dados armazenados para restauração:",
        userData ? "Dados de usuário encontrados" : "Sem dados de usuário",
        authToken ? "Token encontrado" : "Sem token"
      );

      if (userData && userData.email && userData.password) {
        console.log("Tentando restaurar sessão com credenciais armazenadas");

        try {
          // Adicionar um pequeno atraso para garantir que o Firebase Auth esteja pronto
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log("Restaurando sessão com credenciais armazenadas");

          // Fazer login diretamente
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            userData.email,
            userData.password
          );

          console.log("Login com credenciais armazenadas bem-sucedido");

          // Atualizar o token após o login bem-sucedido
          const newToken = await getIdToken(userCredential.user);
          await saveAuthToken(newToken);

          // Obter dados do usuário do Firestore para verificar o status do onboarding
          const userDoc = await getDoc(
            doc(db, "users", userCredential.user.uid)
          );
          const userDocData = userDoc.data();
          const onboardingCompleted = userDocData
            ? userDocData.onboardingCompleted
            : false;

          // Atualizar os dados do usuário armazenados
          await saveUserData({
            ...userData,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            onboardingCompleted: onboardingCompleted,
            password: userData.password,
            isAnonymous: userCredential.user.isAnonymous,
          });

          // Definir o usuário manualmente
          setUser(userCredential.user);
          setIsAnonymous(userCredential.user.isAnonymous);
          setIsNewUser(!onboardingCompleted);

          console.log(
            "Sessão restaurada com sucesso usando credenciais armazenadas"
          );
          setSessionRestored(true);
          setLoading(false);
          return true;
        } catch (error) {
          console.error("Erro ao restaurar sessão com credenciais:", error);
          // Se falhar, limpar os dados armazenados para evitar tentativas futuras com credenciais inválidas
          await removeUserData();
          await removeAuthToken();
        }
      } else {
        console.log(
          "Sem dados de usuário ou credenciais armazenados para restaurar sessão"
        );
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error("Erro ao restaurar sessão:", error);
      // Em caso de erro, limpar os dados armazenados para evitar problemas futuros
      try {
        await removeUserData();
        await removeAuthToken();
      } catch (cleanupError) {
        console.error(
          "Erro ao limpar dados após falha na restauração:",
          cleanupError
        );
      }
      setLoading(false);
      return false;
    }
  };

  // Verificar se há um usuário armazenado no SecureStore ao iniciar
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        await restoreSession();
      } catch (error) {
        console.error("Erro ao verificar usuário armazenado:", error);
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    if (sessionRestoreAttempted) {
      const unsubscribe = onAuthStateChanged(
        firebaseAuth,
        async (currentUser: FirebaseUser | null) => {
          console.log(
            "Estado de autenticação alterado:",
            currentUser ? "Autenticado" : "Não autenticado"
          );

          if (currentUser) {
            try {
              // Se for usuário anônimo, não persistir dados
              if (currentUser.isAnonymous) {
                console.log("Usuário anônimo: dados não serão persistidos");
                setUser(currentUser);
                setIsAnonymous(true);
                setIsNewUser(true);
                setLoading(false);
                return;
              }

              // Para usuários não anônimos, continuar com o fluxo normal
              const idToken = await getIdToken(currentUser);
              await saveAuthToken(idToken);
              setIsAnonymous(false);

              const userDoc = await getDoc(doc(db, "users", currentUser.uid));
              const userDocData = userDoc.data();
              const onboardingCompleted = userDocData
                ? userDocData.onboardingCompleted
                : false;

              const storedUserData = (await getUserData()) || {};
              await saveUserData({
                ...storedUserData,
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                onboardingCompleted: onboardingCompleted,
                isAnonymous: false,
                password: storedUserData.password,
              });

              setIsNewUser(!onboardingCompleted);
              setSessionRestored(true);
            } catch (error) {
              console.error("Erro ao processar usuário autenticado:", error);
            }
          }

          setUser(currentUser);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [sessionRestoreAttempted]);

  // Nova função para verificar o status do email
  const checkEmailStatus = async (email: string) => {
    try {
      const methods = await fetchSignInMethodsForEmail(firebaseAuth, email);
      const exists = methods.length > 0;

      if (exists) {
        // Se o email existe, verificar se o onboarding foi concluído
        // Para isso, precisamos fazer login primeiro
        try {
          // Não podemos verificar diretamente sem o login,
          // então retornamos apenas a informação de que a conta existe
          return { exists: true, onboardingCompleted: false };
        } catch (error) {
          console.error("Erro ao verificar status do onboarding:", error);
          return { exists: true, onboardingCompleted: false };
        }
      }

      return { exists: false, onboardingCompleted: false };
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      // Obter o token de ID do usuário
      const idToken = await getIdToken(userCredential.user);

      // Salvar o token no SecureStore
      await saveAuthToken(idToken);

      // Obter dados do usuário do Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userDocData = userDoc.data();

      // Verificar se o onboarding foi concluído
      const onboardingCompleted = userDocData
        ? userDocData.onboardingCompleted
        : false;

      // Salvar dados do usuário no SecureStore, incluindo a senha para restauração de sessão
      await saveUserData({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        password: password, // Armazenar a senha para restauração de sessão
        onboardingCompleted: onboardingCompleted,
        isAnonymous: userCredential.user.isAnonymous,
      });

      // Definir o estado de novo usuário
      setIsNewUser(!onboardingCompleted);
      setIsAnonymous(userCredential.user.isAnonymous);

      // Redirecionar com base no status do onboarding
      if (!onboardingCompleted) {
        router.replace("/onboarding/gender");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Verificar se o email já existe
      const { exists } = await checkEmailStatus(email);

      if (exists) {
        throw new Error(
          "Este email já está cadastrado. Por favor, faça login."
        );
      }

      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      ).catch((error: FirebaseAuthError) => {
        if (error.code === "auth/email-already-in-use") {
          throw new Error(
            "Este email já está cadastrado. Por favor, faça login."
          );
        }
        throw error;
      });

      // Atualizar o perfil do usuário com o nome
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Obter o token de ID do usuário
      const idToken = await getIdToken(userCredential.user);

      // Salvar o token no SecureStore
      await saveAuthToken(idToken);

      // Salvar dados do usuário no SecureStore, incluindo a senha para restauração de sessão
      await saveUserData({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        password: password, // Armazenar a senha para restauração de sessão
        onboardingCompleted: false,
        isAnonymous: false,
      });

      // Criar um documento de usuário no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
      });

      // Definir o usuário e o estado de novo usuário
      setUser(userCredential.user);
      setIsNewUser(true);
      setIsAnonymous(false);

      // Redirecionar explicitamente para o onboarding
      console.log("Redirecionando para onboarding após registro...");
      router.replace("/onboarding/gender");
    } catch (error) {
      console.error("Erro ao registrar:", error);
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      console.log("Iniciando login anônimo...");
      const userCredential = await signInAnonymouslyFirebase(firebaseAuth);

      console.log("Login anônimo bem-sucedido");

      // Definir o usuário e o estado
      setUser(userCredential.user);
      setIsAnonymous(true);
      setIsNewUser(true);

      // Não salvar dados do usuário anônimo
      console.log("Usuário anônimo: dados não serão persistidos");

      return userCredential.user;
    } catch (error) {
      console.error("Erro ao fazer login anônimo:", error);
      throw error;
    }
  };

  const completeAnonymousRegistration = async (
    name: string,
    email: string,
    password: string
  ): Promise<FirebaseUser> => {
    try {
      console.log("Iniciando registro permanente...");

      // Recuperar dados temporários de nutrição antes de criar o usuário
      const tempNutritionData =
        await OfflineStorage.getTemporaryNutritionData();
      console.log("Dados temporários recuperados:", tempNutritionData);

      // Criar novo usuário
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      // Atualizar perfil
      await updateProfile(newUser, { displayName: name });

      // Salvar dados do usuário no Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
        onboardingCompleted: true,
      });

      // Se tiver dados de nutrição temporários, salvá-los no Firestore
      if (tempNutritionData) {
        console.log("Salvando dados de nutrição no Firestore...");
        await setDoc(doc(db, "nutrition", newUser.uid), {
          ...tempNutritionData,
          updatedAt: serverTimestamp(),
        });
      }

      // Salvar dados do usuário localmente
      await saveUserData({
        uid: newUser.uid,
        email: newUser.email,
        displayName: name,
        password: password,
        onboardingCompleted: true,
        isAnonymous: false,
      });

      // Atualizar estado
      setUser(newUser);
      setIsAnonymous(false);
      setIsNewUser(false);

      // Notificar que o registro foi concluído
      notifyRegistrationCompleted();

      // Limpar dados temporários após salvar
      await OfflineStorage.clearTemporaryNutritionData();

      router.replace("/(tabs)");
      return newUser;
    } catch (error) {
      console.error("Erro ao completar registro:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Iniciando processo de logout...");

      // Primeiro limpar os dados locais
      try {
        await removeUserData();
        console.log("Dados do usuário removidos com sucesso");
      } catch (e) {
        console.error("Erro ao remover dados do usuário:", e);
      }

      try {
        await removeAuthToken();
        console.log("Token de autenticação removido com sucesso");
      } catch (e) {
        console.error("Erro ao remover token de autenticação:", e);
      }

      // Depois fazer logout no Firebase
      await firebaseSignOut(firebaseAuth);
      console.log("Logout do Firebase realizado com sucesso");

      // Limpar estados locais
      setUser(null);
      setIsAnonymous(false);
      setSessionRestored(false);
      setSessionRestoreAttempted(false);

      // Redirecionar para login
      router.replace("/auth/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    signOut,
    isNewUser,
    isAnonymous,
    checkEmailStatus,
    restoreSession,
    setUser,
    setLoading,
    sessionRestoreAttempted,
    signInAnonymously,
    completeAnonymousRegistration,
    registrationCompleted,
    notifyRegistrationCompleted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
