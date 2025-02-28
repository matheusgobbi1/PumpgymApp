import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
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
  appInitialized: boolean;
  authStateStable: boolean;
  isRestoringSession: boolean;
  navigationAttempted: boolean;
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
  const [sessionRestoreAttempted, setSessionRestoreAttempted] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const [authStateStable, setAuthStateStable] = useState(false);
  const [navigationLocked, setNavigationLocked] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [navigationAttempted, setNavigationAttempted] = useState(false);
  const router = useRouter();

  const notifyRegistrationCompleted = () => {
    setRegistrationCompleted(true);
    setTimeout(() => setRegistrationCompleted(false), 1000);
  };

  const handleNavigation = useCallback(
    async (currentUser: FirebaseUser | null) => {
      if (
        navigationLocked ||
        !authStateStable ||
        isRestoringSession ||
        navigationAttempted
      ) {
        console.log(
          "Navegação bloqueada:",
          navigationLocked
            ? "Navegação em andamento"
            : !authStateStable
            ? "Estado não estável"
            : isRestoringSession
            ? "Restaurando sessão"
            : "Navegação já realizada"
        );
        return;
      }

      try {
        setNavigationLocked(true);
        setNavigationAttempted(true);
        console.log("Iniciando navegação com estado estável...");

        if (!currentUser) {
          console.log(
            "Nenhum usuário autenticado, redirecionando para login..."
          );
          await router.replace("/auth/login");
          return;
        }

        if (currentUser.isAnonymous) {
          console.log("Usuário anônimo, redirecionando para onboarding...");
          await router.replace("/onboarding/gender");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const onboardingCompleted = userData?.onboardingCompleted ?? false;

        if (!onboardingCompleted) {
          console.log(
            "Onboarding não completo, redirecionando para onboarding..."
          );
          await router.replace("/onboarding/gender");
        } else {
          console.log(
            "Usuário autenticado e onboarding completo, indo para tabs..."
          );
          await router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Erro ao decidir navegação:", error);
        setNavigationAttempted(false); // Permite nova tentativa em caso de erro
        await router.replace("/auth/login");
      } finally {
        setNavigationLocked(false);
      }
    },
    [router, authStateStable, isRestoringSession, navigationAttempted]
  );

  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsRestoringSession(true);
      setNavigationAttempted(false);
      setSessionRestoreAttempted(true);
      setAuthStateStable(false);
      console.log("Iniciando restauração de sessão...");

      if (auth.currentUser) {
        console.log("Usuário já autenticado no Firebase");
        setUser(auth.currentUser);
        setIsAnonymous(auth.currentUser.isAnonymous);
        setAuthStateStable(true);
        return true;
      }

      const userData = await getUserData();
      const authToken = await getAuthToken();

      if (userData?.email && userData?.password) {
        try {
          console.log("Tentando restaurar sessão com credenciais armazenadas");
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            userData.email,
            userData.password
          );

          const newToken = await getIdToken(userCredential.user);
          await saveAuthToken(newToken);

          const userDoc = await getDoc(
            doc(db, "users", userCredential.user.uid)
          );
          const onboardingCompleted =
            userDoc.data()?.onboardingCompleted ?? false;

          await saveUserData({
            ...userData,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            onboardingCompleted,
            password: userData.password,
            isAnonymous: userCredential.user.isAnonymous,
          });

          setUser(userCredential.user);
          setIsAnonymous(userCredential.user.isAnonymous);
          setIsNewUser(!onboardingCompleted);
          setAuthStateStable(true);
          return true;
        } catch (error) {
          console.error("Erro ao restaurar sessão:", error);
          await removeUserData();
          await removeAuthToken();
        }
      }

      setAuthStateStable(true);
      return false;
    } catch (error) {
      console.error("Erro ao restaurar sessão:", error);
      setAuthStateStable(true);
      return false;
    } finally {
      setLoading(false);
      setIsRestoringSession(false);
    }
  }, []);

  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;

    const initializeApp = async () => {
      try {
        setAuthStateStable(false);
        setNavigationAttempted(false);
        await restoreSession();

        authUnsubscribe = onAuthStateChanged(
          firebaseAuth,
          async (currentUser) => {
            console.log(
              "Estado de autenticação alterado:",
              currentUser ? "Autenticado" : "Não autenticado"
            );

            setAuthStateStable(false);
            setIsRestoringSession(true);
            setNavigationAttempted(false);

            if (currentUser) {
              if (currentUser.isAnonymous) {
                console.log("Usuário anônimo detectado");
                setUser(currentUser);
                setIsAnonymous(true);
                setIsNewUser(true);
              } else {
                console.log("Usuário autenticado detectado");
                const idToken = await getIdToken(currentUser);
                await saveAuthToken(idToken);

                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                const onboardingCompleted =
                  userDoc.data()?.onboardingCompleted ?? false;

                setUser(currentUser);
                setIsAnonymous(false);
                setIsNewUser(!onboardingCompleted);
              }
            } else {
              console.log("Nenhum usuário detectado");
              setUser(null);
              setIsAnonymous(false);
            }

            setAuthStateStable(true);
            setLoading(false);
            setAppInitialized(true);
            setIsRestoringSession(false);
          }
        );
      } catch (error) {
        console.error("Erro na inicialização do app:", error);
        setAuthStateStable(true);
        setLoading(false);
        setAppInitialized(true);
        setIsRestoringSession(false);
      }
    };

    initializeApp();

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, [restoreSession]);

  // Efeito para gerenciar navegação quando o estado de autenticação estabiliza
  useEffect(() => {
    const attemptNavigation = async () => {
      if (
        authStateStable &&
        appInitialized &&
        !loading &&
        !isRestoringSession &&
        !navigationAttempted
      ) {
        console.log("Estado estável detectado, tentando navegação...");
        await handleNavigation(user);
      }
    };

    attemptNavigation();
  }, [
    authStateStable,
    appInitialized,
    loading,
    isRestoringSession,
    navigationAttempted,
    user,
    handleNavigation,
  ]);

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
      setNavigationAttempted(false);
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
    appInitialized,
    authStateStable,
    isRestoringSession,
    navigationAttempted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
