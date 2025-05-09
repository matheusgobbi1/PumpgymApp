import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as authSignOut,
  User as FirebaseUser,
  Auth as FirebaseAuth,
  updateProfile,
  onAuthStateChanged,
  getIdToken,
  signInWithCredential,
  sendPasswordResetEmail as sendPasswordResetEmailFirebase,
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously as signInAnonymouslyFirebase,
  updateEmail,
  updatePassword,
  fetchSignInMethodsForEmail,
  OAuthProvider,
  type AuthError as FirebaseAuthError,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
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
import { KEYS } from "../constants/keys";
import { FirebaseError } from "firebase/app";
import NetInfo from "@react-native-community/netinfo";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";

// Verificar se estamos em um build nativo ou Expo Go
const isExpoGo = Constants.executionEnvironment === "standalone";

// Garantir que auth é do tipo FirebaseAuth
const firebaseAuth: FirebaseAuth = auth;

// Inicializar RevenueCat
const initializeRevenueCat = () => {
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "ios" && iosKey) {
    Purchases.configure({ apiKey: iosKey });
  }
};

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
  sendPasswordResetEmail: (email: string) => Promise<void>;
  loginWithApple: () => Promise<void>;
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  checkSubscriptionStatus: () => Promise<boolean>;
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();

  // Inicializar RevenueCat
  useEffect(() => {
    initializeRevenueCat();
  }, []);

  // Verificar status de assinatura
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
      if (!user) return false;

      // SIMULAÇÃO PARA TESTE: Forçar assinatura para usuário específico
      if (user.uid === "4N7KtLUsNNV9mF3EGo5OyoctHr72") {
        setIsSubscribed(true);
        await OfflineStorage.saveSubscriptionStatus(user.uid, true);
        return true;
      }

      // Verificar conexão com a internet
      const isOnline = await OfflineStorage.isOnline();

      if (!isOnline) {
        // Se estiver offline, utilizar o status salvo localmente
        const cachedStatus = await OfflineStorage.getSubscriptionStatus(
          user.uid
        );
        setIsSubscribed(cachedStatus);
        return cachedStatus;
      }

      // Se estiver online, verificar com o RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPRO =
        typeof customerInfo.entitlements.active.PRO !== "undefined";

      // Salvar o status localmente para uso offline
      await OfflineStorage.saveSubscriptionStatus(user.uid, hasPRO);

      setIsSubscribed(hasPRO);
      return hasPRO;
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);

      // Em caso de erro, tentar usar o status offline como fallback
      if (user) {
        const offlineStatus = await OfflineStorage.getSubscriptionStatus(
          user.uid
        );
        setIsSubscribed(offlineStatus);
        return offlineStatus;
      }

      return false;
    }
  };

  // Função para verificar assinatura ao inicializar
  useEffect(() => {
    if (user && !user.isAnonymous) {
      checkSubscriptionStatus();
    }
  }, [user]);

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
        return;
      }

      try {
        setNavigationLocked(true);
        setNavigationAttempted(true);

        if (!currentUser) {
          await router.replace("/auth/login");
          return;
        }

        if (currentUser.isAnonymous) {
          await router.replace("/onboarding/gender");
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userData = userDoc.data();
          const onboardingCompleted = userData?.onboardingCompleted ?? false;

          if (!onboardingCompleted) {
            await router.replace("/onboarding/gender");
          } else {
            // Verificar status de assinatura
            const hasSubscription = await checkSubscriptionStatus();

            if (!hasSubscription) {
              await router.replace("/paywall");
            } else {
              await router.replace("/(tabs)");
            }
          }
        } catch (error) {
          await router.replace("/auth/login");
        }
      } catch (error) {
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

      // Verificar conexão com a internet
      const isOnline = await OfflineStorage.isOnline();

      // Verificar se já existe um usuário autenticado no Firebase
      if (auth.currentUser) {
        setUser(auth.currentUser);
        setIsAnonymous(auth.currentUser.isAnonymous);

        // Salvar o ID do último usuário logado
        await OfflineStorage.saveLastLoggedUser(auth.currentUser.uid);

        // Verificar status de assinatura
        await checkSubscriptionStatus();

        return true;
      }

      // Tentar restaurar a sessão a partir do armazenamento local
      try {
        const userData = await getUserData();
        const authToken = await getAuthToken();

        if (userData?.email && userData?.password) {
          try {
            // Se estiver offline, considerar o usuário autenticado com os dados locais
            if (!isOnline) {
              // Definir o usuário baseado nos dados armazenados localmente
              // Isso evita redirecionamento para a tela de login quando offline
              setUser({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                isAnonymous: userData.isAnonymous || false,
                // Outras propriedades necessárias podem ser adicionadas aqui
              } as FirebaseUser);
              setIsAnonymous(userData.isAnonymous || false);
              setIsNewUser(!userData.onboardingCompleted);

              // Salvar o ID do último usuário logado
              await OfflineStorage.saveLastLoggedUser(userData.uid);

              // Verificar status de assinatura offline
              const hasSubscription =
                await OfflineStorage.getSubscriptionStatus(userData.uid);
              setIsSubscribed(hasSubscription);

              return true;
            }

            // Se estiver online, tenta autenticar no Firebase
            const userCredential = await signInWithEmailAndPassword(
              firebaseAuth,
              userData.email,
              userData.password
            );

            try {
              const newToken = await getIdToken(userCredential.user);
              await saveAuthToken(newToken);
            } catch (error) {
              // Erro ao obter token
            }

            try {
              const userDoc = await getDoc(
                doc(db, "users", userCredential.user.uid)
              );
              const onboardingCompleted = userDoc.exists()
                ? userDoc.data()?.onboardingCompleted ?? false
                : false;

              await saveUserData({
                ...userData,
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                onboardingCompleted,
                password: userData.password,
                isAnonymous: userCredential.user.isAnonymous,
              });

              // Salvar o ID do último usuário logado
              await OfflineStorage.saveLastLoggedUser(userCredential.user.uid);

              // Verificar status de assinatura
              await checkSubscriptionStatus();

              setUser(userCredential.user);
              setIsAnonymous(userCredential.user.isAnonymous);
              setIsNewUser(!onboardingCompleted);
              return true;
            } catch (error) {
              // Erro ao obter dados do usuário
              setUser(userCredential.user);
              setIsAnonymous(userCredential.user.isAnonymous);
              setIsNewUser(true);

              // Mesmo com erro, salvar o ID do usuário
              await OfflineStorage.saveLastLoggedUser(userCredential.user.uid);

              // Verificar status de assinatura
              await checkSubscriptionStatus();

              return true;
            }
          } catch (error) {
            // Se o erro for devido à falta de conexão, usar os dados locais
            if (!isOnline) {
              // Definir o usuário baseado nos dados armazenados localmente
              setUser({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                isAnonymous: userData.isAnonymous || false,
                // Outras propriedades necessárias podem ser adicionadas aqui
              } as FirebaseUser);
              setIsAnonymous(userData.isAnonymous || false);
              setIsNewUser(!userData.onboardingCompleted);

              // Salvar o ID do último usuário logado
              await OfflineStorage.saveLastLoggedUser(userData.uid);

              // Verificar status de assinatura offline
              const hasSubscription =
                await OfflineStorage.getSubscriptionStatus(userData.uid);
              setIsSubscribed(hasSubscription);

              return true;
            }

            // Se estiver online mas houve erro de autenticação, limpar dados inválidos
            await removeUserData();
            await removeAuthToken();
          }
        }
      } catch (error) {
        // Erro ao obter dados do usuário do armazenamento local
      }

      return false;
    } catch (error) {
      // Erro ao restaurar sessão
      return false;
    } finally {
      setLoading(false);
      setIsRestoringSession(false);
      setAuthStateStable(true);
    }
  }, []);

  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;
    let netInfoUnsubscribe: (() => void) | null = null;

    const initializeApp = async () => {
      try {
        setAuthStateStable(false);
        setNavigationAttempted(false);

        // Configurar listener para conectividade de rede
        netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
          // Se reconectar à internet e não houver usuário, tentar restaurar sessão
          if (state.isConnected && !user && authStateStable) {
            try {
              await restoreSession();
            } catch (error) {
              // Erro ao restaurar sessão após reconexão
            }
          }
        });

        // Tentar restaurar a sessão primeiro
        try {
          await restoreSession();
        } catch (error) {
          // Erro ao restaurar sessão
        }

        // Configurar o listener de autenticação
        authUnsubscribe = onAuthStateChanged(
          firebaseAuth,
          async (currentUser) => {
            try {
              setAuthStateStable(false);
              setIsRestoringSession(true);
              setNavigationAttempted(false);

              if (currentUser) {
                if (currentUser.isAnonymous) {
                  setUser(currentUser);
                  setIsAnonymous(true);
                  setIsNewUser(true);
                } else {
                  try {
                    const idToken = await getIdToken(currentUser);
                    await saveAuthToken(idToken);
                  } catch (error) {
                    // Erro ao obter token
                  }

                  try {
                    const userDoc = await getDoc(
                      doc(db, "users", currentUser.uid)
                    );
                    const onboardingCompleted =
                      userDoc.data()?.onboardingCompleted ?? false;

                    setUser(currentUser);
                    setIsAnonymous(false);
                    setIsNewUser(!onboardingCompleted);
                  } catch (error) {
                    // Verificar se o erro é devido à falta de conexão
                    const isOnline = await OfflineStorage.isOnline();
                    if (!isOnline) {
                      // Se offline, obter dados do armazenamento local
                      try {
                        const userData = await getUserData();
                        if (userData && userData.uid === currentUser.uid) {
                          setIsNewUser(!userData.onboardingCompleted);
                        }
                      } catch (localError) {
                        // Erro ao obter dados locais
                      }
                    }

                    // Definir usuário mesmo sem obter dados adicionais
                    setUser(currentUser);
                    setIsAnonymous(false);
                    setIsNewUser(true);
                  }
                }
              } else {
                // Se não há usuário, verificar se temos dados locais
                // e se estamos offline antes de limpar o estado
                const isOnline = await OfflineStorage.isOnline();
                const userData = await getUserData();

                if (!isOnline && userData && userData.uid) {
                  // Se offline e temos dados locais, criar um usuário baseado nesses dados
                  setUser({
                    uid: userData.uid,
                    email: userData.email,
                    displayName: userData.displayName,
                    isAnonymous: userData.isAnonymous || false,
                  } as FirebaseUser);
                  setIsAnonymous(userData.isAnonymous || false);
                  setIsNewUser(!userData.onboardingCompleted);
                } else {
                  setUser(null);
                  setIsAnonymous(false);
                }
              }
            } catch (error) {
              // Erro no listener de autenticação
            } finally {
              setAuthStateStable(true);
              setLoading(false);
              setAppInitialized(true);
              setIsRestoringSession(false);
            }
          },
          (error) => {
            // Erro no listener de autenticação
            setAuthStateStable(true);
            setLoading(false);
            setAppInitialized(true);
            setIsRestoringSession(false);
          }
        );
      } catch (error) {
        // Erro na inicialização do app
      } finally {
        // Garantir que os estados sejam atualizados mesmo em caso de erro
        setTimeout(() => {
          setAuthStateStable(true);
          setLoading(false);
          setAppInitialized(true);
          setIsRestoringSession(false);
        }, 1000);
      }
    };

    initializeApp();

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      if (netInfoUnsubscribe) {
        netInfoUnsubscribe();
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
          // Erro ao verificar status do onboarding
          return { exists: true, onboardingCompleted: false };
        }
      }

      return { exists: false, onboardingCompleted: false };
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Limpar dados de treino de outros usuários
      try {
        // Obter todas as chaves do AsyncStorage
        const keys = await AsyncStorage.getAllKeys();

        // Filtrar chaves relacionadas a treinos
        const workoutKeys = keys.filter(
          (key) =>
            key.includes("@pumpgym:workouts:") ||
            key.includes("@pumpgym:workoutTypes:") ||
            key.includes("@pumpgym:trainingGoals:")
        );

        // Remover todas as chaves de treino
        if (workoutKeys.length > 0) {
          await AsyncStorage.multiRemove(workoutKeys);
        }

        // Limpar os lembretes (tanto a chave antiga quanto as novas com userId)
        await AsyncStorage.removeItem("@fitfolio_reminders");

        // Limpar todas as chaves de lembretes
        const reminderKeys = keys.filter((key) =>
          key.startsWith("@fitfolio_reminders:")
        );

        if (reminderKeys.length > 0) {
          await AsyncStorage.multiRemove(reminderKeys);
        }
      } catch (error) {
        // Erro ao limpar dados de treino
        console.log("Erro ao limpar dados antigos:", error);
      }

      // Validar inputs
      if (!email || !password) {
        throw new Error("Email e senha são obrigatórios");
      }

      // Tentar fazer login
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

        // Salvar o ID do último usuário logado
        await OfflineStorage.saveLastLoggedUser(userCredential.user.uid);

        // Verificar e salvar o status de assinatura
        await checkSubscriptionStatus();

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
        // Rethrow para ser capturado pelo tratador de erros externo
        throw error;
      }
    } catch (error) {
      // Mostrar erros específicos para o login
      if (error instanceof FirebaseError) {
        throw error;
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Erro desconhecido ao fazer login");
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Validar inputs
      if (!name || !email || !password) {
        throw new Error("Nome, email e senha são obrigatórios");
      }

      // Verificar se o email já existe
      try {
        const { exists } = await checkEmailStatus(email);

        if (exists) {
          throw new Error(
            "Este email já está cadastrado. Por favor, faça login."
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("já está cadastrado")
        ) {
          throw error;
        }
        // Se for outro tipo de erro na verificação de email, continue com o cadastro
        console.log(
          "Erro ao verificar email, continuando com o cadastro:",
          error
        );
      }

      // Limpar dados de treino de contas anteriores
      try {
        // Obter todas as chaves do AsyncStorage
        const keys = await AsyncStorage.getAllKeys();

        // Filtrar todas as chaves relacionadas a treinos
        const workoutKeys = keys.filter(
          (key) =>
            key.includes("@pumpgym:workouts:") ||
            key.includes("@pumpgym:workoutTypes:") ||
            key.includes("@pumpgym:trainingGoals:")
        );

        // Remover todas as chaves de treino
        if (workoutKeys.length > 0) {
          await AsyncStorage.multiRemove(workoutKeys);
        }

        // Limpar os lembretes (tanto a chave antiga quanto as novas com userId)
        await AsyncStorage.removeItem("@fitfolio_reminders");

        // Limpar todas as chaves de lembretes
        const reminderKeys = keys.filter((key) =>
          key.startsWith("@fitfolio_reminders:")
        );

        if (reminderKeys.length > 0) {
          await AsyncStorage.multiRemove(reminderKeys);
        }
      } catch (e) {
        // Erro ao limpar dados de treino
        console.log("Erro ao limpar dados antigos:", e);
      }

      try {
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
        router.replace("/onboarding/gender");
      } catch (error) {
        // Rethrow para captura externa
        throw error;
      }
    } catch (error) {
      // Mostrar erros específicos para o registro
      if (error instanceof FirebaseError) {
        throw error;
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Erro desconhecido ao cadastrar");
      }
    }
  };

  const signInAnonymously = async () => {
    try {
      const userCredential = await signInAnonymouslyFirebase(firebaseAuth);

      // Definir o usuário e o estado
      setUser(userCredential.user);
      setIsAnonymous(true);
      setIsNewUser(true);

      // Não salvar dados do usuário anônimo

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const completeAnonymousRegistration = async (
    name: string,
    email: string,
    password: string
  ): Promise<FirebaseUser> => {
    try {
      // Bloquear navegação e sinalizações de mudança de estado imediatamente
      setNavigationLocked(true);

      // Recuperar dados temporários de nutrição antes de criar o usuário
      const tempNutritionData =
        await OfflineStorage.getTemporaryNutritionData();

      // Salvar temporariamente os dados de treino do usuário anônimo
      let anonymousWorkouts = null;
      let anonymousWorkoutTypes = null;
      let anonymousTrainingGoals = null;

      try {
        const workoutsData = await AsyncStorage.getItem(
          `@pumpgym:workouts:anonymous`
        );
        if (workoutsData) anonymousWorkouts = JSON.parse(workoutsData);

        const workoutTypesData = await AsyncStorage.getItem(
          `@pumpgym:workoutTypes:anonymous`
        );
        if (workoutTypesData)
          anonymousWorkoutTypes = JSON.parse(workoutTypesData);

        const trainingGoalsData = await AsyncStorage.getItem(
          `@pumpgym:trainingGoals:anonymous`
        );
        if (trainingGoalsData)
          anonymousTrainingGoals = JSON.parse(trainingGoalsData);
      } catch (e) {
        // Erro ao obter dados de treino do usuário anônimo
      }

      // Criar novo usuário
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      // Atualizar perfil
      await updateProfile(newUser, { displayName: name });

      // Salvar dados do usuário no Firestore com onboardingCompleted = true
      // para garantir que não será redirecionado para a tela de gênero
      await setDoc(doc(db, "users", newUser.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
        onboardingCompleted: true,
      });

      // Se tiver dados de nutrição temporários, salvá-los no Firestore
      if (tempNutritionData) {
        await setDoc(doc(db, "nutrition", newUser.uid), {
          ...tempNutritionData,
          updatedAt: serverTimestamp(),
        });
      }

      // Transferir dados de treino do usuário anônimo para o novo usuário
      try {
        if (anonymousWorkouts) {
          await AsyncStorage.setItem(
            `@pumpgym:workouts:${newUser.uid}`,
            JSON.stringify(anonymousWorkouts)
          );
        }

        if (anonymousWorkoutTypes) {
          await AsyncStorage.setItem(
            `@pumpgym:workoutTypes:${newUser.uid}`,
            JSON.stringify(anonymousWorkoutTypes)
          );
        }

        if (anonymousTrainingGoals) {
          await AsyncStorage.setItem(
            `@pumpgym:trainingGoals:${newUser.uid}`,
            JSON.stringify(anonymousTrainingGoals)
          );
        }

        // Limpar dados do usuário anônimo
        await AsyncStorage.removeItem(`@pumpgym:workouts:anonymous`);
        await AsyncStorage.removeItem(`@pumpgym:workoutTypes:anonymous`);
        await AsyncStorage.removeItem(`@pumpgym:trainingGoals:anonymous`);
      } catch (e) {
        // Erro ao transferir dados de treino
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

      // Salvar status de onboarding localmente
      await OfflineStorage.saveOnboardingStatus(newUser.uid, true);

      // Limpar dados temporários após salvar
      await OfflineStorage.clearTemporaryNutritionData();

      // Atualizar estados DEPOIS de todas as operações de banco de dados
      setUser(newUser);
      setIsAnonymous(false);
      setIsNewUser(false);

      // Navegar para paywall (alterado de/(tabs) para /paywall)
      await router.replace("/paywall");

      // Notificar que o registro foi concluído após a navegação
      notifyRegistrationCompleted();

      // Aguardar um momento para garantir que a navegação iniciou
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Só agora desbloquear a navegação e permitir tentativas futuras
      setTimeout(() => {
        setNavigationLocked(false);
        setNavigationAttempted(true);
      }, 500);

      return newUser;
    } catch (error) {
      // Em caso de erro, desbloquear a navegação
      setNavigationLocked(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setNavigationAttempted(false);

      // Identificar o usuário atual antes de fazer logout
      const currentUserId = user?.uid;

      // Tentar salvar os dados de treino antes de fazer logout sem usar hooks
      if (currentUserId) {
        try {
          // Obter os dados diretamente do AsyncStorage
          const workoutsKey = `${KEYS.WORKOUTS}:${currentUserId}`;
          const workoutTypesKey = `${KEYS.AVAILABLE_WORKOUT_TYPES}:${currentUserId}`;

          const storedWorkouts = await AsyncStorage.getItem(workoutsKey);
          const storedWorkoutTypes = await AsyncStorage.getItem(
            workoutTypesKey
          );

          if (
            storedWorkouts &&
            storedWorkoutTypes &&
            currentUserId !== "anonymous"
          ) {
            try {
              // Salvar diretamente no Firestore
              const db = getFirestore();
              const workoutsRef = doc(
                db,
                "users",
                currentUserId,
                "workouts",
                "data"
              );

              await setDoc(
                workoutsRef,
                {
                  workouts: JSON.parse(storedWorkouts),
                  availableWorkoutTypes: JSON.parse(storedWorkoutTypes),
                  lastUpdated: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (firebaseError) {
              // Erro ao salvar treinos no Firebase durante logout
            }
          }
        } catch (e) {
          // Erro ao processar dados de treino durante logout
        }
      }

      // Primeiro limpar os dados locais
      try {
        await removeUserData();
      } catch (e) {
        // Erro ao remover dados do usuário
      }

      try {
        await removeAuthToken();
      } catch (e) {
        // Erro ao remover token de autenticação
      }

      // Limpar dados de treino
      try {
        await AsyncStorage.removeItem(`@pumpgym:workouts:${user?.uid}`);
        await AsyncStorage.removeItem(`@pumpgym:workoutTypes:${user?.uid}`);
        await AsyncStorage.removeItem(`@pumpgym:trainingGoals:${user?.uid}`);

        // Limpar também dados sem userId específico (para compatibilidade)
        await AsyncStorage.removeItem(`@pumpgym:workouts:anonymous`);
        await AsyncStorage.removeItem(`@pumpgym:workoutTypes:anonymous`);
        await AsyncStorage.removeItem(`@pumpgym:trainingGoals:anonymous`);

        // Limpar os lembretes (tanto a chave antiga quanto as novas com userId)
        await AsyncStorage.removeItem("@fitfolio_reminders");

        // Limpar todas as chaves de lembretes
        const allKeys = await AsyncStorage.getAllKeys();
        const reminderKeys = allKeys.filter((key) =>
          key.startsWith("@fitfolio_reminders:")
        );

        if (reminderKeys.length > 0) {
          await AsyncStorage.multiRemove(reminderKeys);
        }
      } catch (e) {
        // Erro ao limpar dados de treino
      }

      // Depois fazer logout no Firebase
      await authSignOut(firebaseAuth);

      // Limpar estados locais
      setUser(null);
      setIsAnonymous(false);
      setSessionRestoreAttempted(false);

      // Redirecionar para login
      router.replace("/auth/login");
    } catch (error) {
      throw error;
    }
  };

  // Função para redefinir senha
  const sendPasswordResetEmail = async (email: string) => {
    try {
      // Verificar se o email existe
      const { exists } = await checkEmailStatus(email);

      if (!exists) {
        throw new Error(
          "Não encontramos uma conta com este email. Verifique o endereço ou crie uma nova conta."
        );
      }

      // Enviar email de redefinição
      await sendPasswordResetEmailFirebase(firebaseAuth, email);
    } catch (error) {
      throw error; // Repassar o erro para ser tratado pelo handler
    }
  };

  // Login com Apple
  const loginWithApple = async () => {
    try {
      setLoading(true);

      // Verificar se o dispositivo suporta autenticação com Apple
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error(
          "Autenticação com Apple não está disponível neste dispositivo"
        );
      }

      // Iniciar o fluxo de autenticação com Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error(
          "Não foi possível obter o token de autenticação da Apple"
        );
      }

      // Criar um provedor OAuth para Apple
      const provider = new OAuthProvider("apple.com");

      // Criar credencial para o Firebase
      const appleCredential = provider.credential({
        idToken: credential.identityToken,
        // O nonce não é necessário em todos os casos, então vamos omiti-lo
      });

      // Fazer login no Firebase com a credencial da Apple
      const userCredential = await signInWithCredential(auth, appleCredential);
      const user = userCredential.user;

      // Determinar o nome de exibição (Apple pode não fornecer em logins subsequentes)
      const displayName = credential.fullName
        ? `${credential.fullName.givenName || ""} ${
            credential.fullName.familyName || ""
          }`.trim()
        : user.displayName || "Usuário Apple";

      // Se o nome estiver vazio e o usuário estiver definido, atualizar o perfil
      if ((!user.displayName || user.displayName === "") && displayName) {
        await updateProfile(user, { displayName });
      }

      // Verificar se é a primeira vez que o usuário faz login
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isNewUserSignup = !userDoc.exists();
      const onboardingCompleted = userDoc.data()?.onboardingCompleted ?? false;

      // Salvar token de autenticação
      const idToken = await getIdToken(user);
      await saveAuthToken(idToken);

      // Se for novo usuário, criar documento no Firestore
      if (isNewUserSignup) {
        await setDoc(doc(db, "users", user.uid), {
          name: displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          onboardingCompleted: false,
          provider: "apple",
        });
      }

      // Salvar dados do usuário localmente
      await saveUserData({
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        onboardingCompleted: isNewUserSignup ? false : onboardingCompleted,
        isAnonymous: false,
      });

      // Atualizar estados
      setUser(user);
      setIsAnonymous(false);
      setIsNewUser(isNewUserSignup || !onboardingCompleted);

      // Redirecionar baseado no status do onboarding
      if (isNewUserSignup || !onboardingCompleted) {
        router.replace("/onboarding/gender");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Erro no login com Apple:", error);
      throw error;
    } finally {
      setLoading(false);
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
    sendPasswordResetEmail,
    loginWithApple,
    isSubscribed,
    setIsSubscribed,
    checkSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
