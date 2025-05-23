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
  type AuthError as FirebaseAuthError,
  deleteUser,
  reauthenticateWithCredential,
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
import * as SecureStore from "expo-secure-store";
import { isFreeUser } from "../utils/freeusers";

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
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  isNewUser: boolean;
  isAnonymous: boolean;
  checkEmailStatus: (
    email: string
  ) => Promise<{ exists: boolean; onboardingCompleted: boolean }>;
  restoreSession: () => Promise<boolean>;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAnonymous: (isAnonymous: boolean) => void;
  setIsNewUser: (isNewUser: boolean) => void;
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
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  checkSubscriptionStatus: () => Promise<boolean>;
  checkOfflineSubscriptionStatus: (userId: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<void>;
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

      // Verificar se o usuário está na lista de usuários gratuitos
      if (isFreeUser(user.uid)) {
        setIsSubscribed(true);
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

  // Função para verificar explicitamente o status de assinatura do usuário
  // quando o app é aberto sem internet
  const checkOfflineSubscriptionStatus = async (
    userId: string
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Verificar se o usuário está na lista de usuários gratuitos
      if (isFreeUser(userId)) {
        setIsSubscribed(true);
        return true;
      }

      // Verificar se há status de assinatura salvo localmente
      const hasSubscription = await OfflineStorage.getSubscriptionStatus(
        userId
      );

      // Atualizar estado
      setIsSubscribed(hasSubscription);

      return hasSubscription;
    } catch (error) {
      console.error("Erro ao verificar status de assinatura offline:", error);
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
            // Reativar verificação de assinatura e redirecionamento para paywall
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

      // Se não tiver usuário autenticado no Firebase, tentar obter último usuário logado
      if (!isOnline) {
        try {
          const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
          if (lastUserId) {
            const localUser = await getUserData();
            if (localUser && localUser.uid) {
              // Criar um usuário temporário baseado nos dados locais
              setUser({
                uid: localUser.uid,
                email: localUser.email,
                displayName: localUser.displayName,
                isAnonymous: localUser.isAnonymous || false,
              } as FirebaseUser);
              setIsAnonymous(localUser.isAnonymous || false);
              setIsNewUser(!localUser.onboardingCompleted);

              // Verificar status de assinatura offline
              await checkOfflineSubscriptionStatus(localUser.uid);

              return true;
            }
          }
        } catch (error) {
          console.error("Erro ao restaurar último usuário conhecido:", error);
        }
      }

      // Tentar restaurar a sessão a partir do armazenamento local
      try {
        const userData = await getUserData();
        const authToken = await getAuthToken();

        if (userData?.email && userData?.uid) {
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
              await checkOfflineSubscriptionStatus(userData.uid);

              return true;
            }

            // Se estiver online e tiver senha, tenta autenticar no Firebase
            if (userData.password) {
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
                await OfflineStorage.saveLastLoggedUser(
                  userCredential.user.uid
                );

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
                await OfflineStorage.saveLastLoggedUser(
                  userCredential.user.uid
                );

                // Verificar status de assinatura
                await checkSubscriptionStatus();

                return true;
              }
            }
            // Se não tiver senha mas tiver credenciais, usar os dados offline
            else {
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
              await checkOfflineSubscriptionStatus(userData.uid);

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
              await checkOfflineSubscriptionStatus(userData.uid);

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
                const isOnline = await OfflineStorage.isOnline();
                const localUserData = await getUserData(); // Renomeado para clareza

                if (!isOnline && localUserData && localUserData.uid) {
                  // Se estivermos offline e tivermos dados de usuário local válidos,
                  // e o estado 'user' atual não for este usuário local (ou for null),
                  // então usamos os dados locais.
                  // Isso preserva a sessão restaurada por restoreSession.
                  if (!user || user.uid !== localUserData.uid) {
                    setUser({
                      uid: localUserData.uid,
                      email: localUserData.email,
                      displayName: localUserData.displayName,
                      isAnonymous: localUserData.isAnonymous || false,
                    } as FirebaseUser);
                    setIsAnonymous(localUserData.isAnonymous || false);
                    setIsNewUser(
                      localUserData.onboardingCompleted !== undefined
                        ? !localUserData.onboardingCompleted
                        : true // Default se onboardingCompleted não estiver nos dados locais
                    );
                    // Considerar chamar checkOfflineSubscriptionStatus aqui se necessário
                    await checkOfflineSubscriptionStatus(localUserData.uid);
                  }
                  // Se 'user' já é 'localUserData', não fazemos nada, já está correto.
                } else {
                  // Só desloga (setUser(null)) se estivermos online OU se não houver dados locais.
                  // Isso evita que um 'null' de onAuthStateChanged (porque o Firebase SDK ainda não carregou a sessão offline)
                  // sobrescreva uma sessão que pode ter sido restaurada manualmente por restoreSession quando offline.
                  if (isOnline || !localUserData?.uid) {
                    setUser(null);
                    setIsAnonymous(false);
                    // Potencialmente limpar tokens/dados locais aqui se for um logout definitivo online
                    if (isOnline) {
                      await removeAuthToken();
                      await removeUserData(); // Cuidado com a chamada a removeUserData aqui, pode ser agressiva demais
                    }
                  }
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
          // Reativar verificação de assinatura antes de navegar
          const hasSubscription = await checkSubscriptionStatus();
          if (!hasSubscription) {
            router.replace("/paywall");
          } else {
            router.replace("/(tabs)");
          }
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

        // Reativar navegação para paywall
        const hasSubscription = await checkSubscriptionStatus();
        if (!hasSubscription) {
          await router.replace("/paywall");
        } else {
          await router.replace("/(tabs)");
        }

        // Notificar que o registro foi concluído após a navegação
        notifyRegistrationCompleted();

        // Aguardar um momento para garantir que a navegação iniciou
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Só agora desbloquear a navegação e permitir tentativas futuras
        setTimeout(() => {
          setNavigationLocked(false);
          setNavigationAttempted(true);
        }, 500);

        return userCredential.user;
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

      // Reativar navegação para paywall
      const hasSubscription = await checkSubscriptionStatus();
      if (!hasSubscription) {
        await router.replace("/paywall");
      } else {
        await router.replace("/(tabs)");
      }

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
              console.error(
                "Erro ao salvar treinos no Firebase:",
                firebaseError
              );
            }
          }
        } catch (e) {
          // Erro ao processar dados de treino durante logout
          console.error("Erro ao processar dados de treino:", e);
        }
      }

      // IMPORTANTE: Antes de remover dados do usuário, salvar uma cópia para recuperação offline
      if (currentUserId) {
        try {
          // Obter dados do usuário atual antes de remover
          const userData = await getUserData();
          if (userData) {
            // Adicionar flag indicando que é um backup
            userData._isBackup = true;
            // Salvar uma cópia dos dados para recuperação offline
            await AsyncStorage.setItem(
              `${KEYS.USER_DATA}_${currentUserId}_backup`,
              JSON.stringify(userData)
            );
          }
        } catch (backupError) {
          console.error(
            "Erro ao criar backup dos dados do usuário:",
            backupError
          );
        }
      }

      // Remover dados do SecureStore, mas manter o AsyncStorage para recuperação offline
      try {
        // Em vez de usar removeUserData que limpa tudo, usar funções específicas
        await SecureStore.deleteItemAsync("user_data");
      } catch (e) {
        console.error("Erro ao remover dados do SecureStore:", e);
      }

      try {
        await removeAuthToken();
      } catch (e) {
        console.error("Erro ao remover token de autenticação:", e);
      }

      // Limpar dados de treino específicos, mantendo os dados de usuário
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
        console.error("Erro ao limpar dados de treino:", e);
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
      console.error("Erro no processo de logout:", error);
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

  // Função para excluir a conta do usuário
  const deleteAccount = async (password: string) => {
    try {
      if (!user || !user.email) {
        throw new Error("Usuário não está autenticado ou não possui email");
      }

      // Reautenticar o usuário antes de excluir a conta
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Excluir documentos relacionados no Firestore
      try {
        // Excluir documento principal do usuário
        await setDoc(
          doc(db, "users", user.uid),
          {
            deleted: true,
            deletedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Tentar excluir outros documentos relacionados
        const userCollections = ["nutrition", "workouts", "history"];

        for (const collection of userCollections) {
          try {
            const docRef = doc(db, collection, user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              await updateDoc(docRef, {
                deleted: true,
                deletedAt: serverTimestamp(),
              });
            }
          } catch (error) {
            console.error(
              `Erro ao marcar documentos em ${collection} como excluídos:`,
              error
            );
          }
        }
      } catch (firestoreError) {
        console.error(
          "Erro ao marcar documentos como excluídos:",
          firestoreError
        );
        // Continuar com a exclusão da conta mesmo se houver erro no Firestore
      }

      // Limpar dados locais
      try {
        // Obter todas as chaves do AsyncStorage
        const keys = await AsyncStorage.getAllKeys();

        // Filtrar chaves relacionadas ao usuário
        const userKeys = keys.filter(
          (key) =>
            key.includes(user.uid) ||
            key.includes("@pumpgym:") ||
            key.includes("@fitfolio_")
        );

        // Remover todas as chaves do usuário
        if (userKeys.length > 0) {
          await AsyncStorage.multiRemove(userKeys);
        }

        // Remover dados do SecureStore
        await removeUserData();
        await removeAuthToken();
      } catch (storageError) {
        console.error("Erro ao limpar dados locais:", storageError);
        // Continuar mesmo com erro
      }

      // Finalmente, excluir a conta do Firebase
      await deleteUser(user);

      // Atualizar estado
      setUser(null);
      setIsAnonymous(false);
      setSessionRestoreAttempted(false);

      // Redirecionar para login
      router.replace("/auth/login");
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
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
    setIsAnonymous,
    setIsNewUser,
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
    isSubscribed,
    setIsSubscribed,
    checkSubscriptionStatus,
    checkOfflineSubscriptionStatus,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
