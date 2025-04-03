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
import { getFirestore } from "firebase/firestore";
import { KEYS } from "../constants/keys";

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
            await router.replace("/(tabs)");
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

      // Verificar se já existe um usuário autenticado no Firebase
      if (auth.currentUser) {
        setUser(auth.currentUser);
        setIsAnonymous(auth.currentUser.isAnonymous);
        return true;
      }

      // Tentar restaurar a sessão a partir do armazenamento local
      try {
        const userData = await getUserData();
        const authToken = await getAuthToken();

        if (userData?.email && userData?.password) {
          try {
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

              setUser(userCredential.user);
              setIsAnonymous(userCredential.user.isAnonymous);
              setIsNewUser(!onboardingCompleted);
              return true;
            } catch (error) {
              // Erro ao obter dados do usuário
              setUser(userCredential.user);
              setIsAnonymous(userCredential.user.isAnonymous);
              setIsNewUser(true);
              return true;
            }
          } catch (error) {
            // Erro ao restaurar sessão
            // Remover dados inválidos
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

    const initializeApp = async () => {
      try {
        setAuthStateStable(false);
        setNavigationAttempted(false);

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
                    // Erro ao obter dados do usuário
                    setUser(currentUser);
                    setIsAnonymous(false);
                    setIsNewUser(true);
                  }
                }
              } else {
                setUser(null);
                setIsAnonymous(false);
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
      }

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
      router.replace("/onboarding/gender");
    } catch (error) {
      throw error;
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
        console.error("Erro ao obter dados do usuário anônimo:", e);
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
        console.error("Erro ao transferir dados de treino:", e);
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

      // Navegar diretamente para a tela principal antes de desbloquear a navegação
      await router.replace("/(tabs)");

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
      console.error("Erro ao completar registro anônimo:", error);
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

              console.log("Treinos sincronizados com Firebase ao fazer logout");
            } catch (firebaseError) {
              console.error(
                "Erro ao salvar treinos no Firebase durante logout:",
                firebaseError
              );
            }
          }
        } catch (e) {
          console.error("Erro ao processar dados de treino durante logout:", e);
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
      await firebaseSignOut(firebaseAuth);

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
