import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Redirect } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { OfflineStorage } from "../services/OfflineStorage";
import { View, ActivityIndicator, Text } from "react-native";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import { getUserData } from "../firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../constants/keys";

export default function InitialRoute() {
  const {
    loading,
    authStateStable,
    isRestoringSession,
    appInitialized,
    user,
    isAnonymous,
    isSubscribed,
    checkSubscriptionStatus,
    setUser,
    setIsSubscribed,
    setIsAnonymous,
    setIsNewUser,
    checkOfflineSubscriptionStatus,
  } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [isCheckingOfflineUser, setIsCheckingOfflineUser] = useState(false);
  const [offlineUser, setOfflineUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const { theme } = useTheme();

  // Verificação inicial mais robusta para cenário offline
  useEffect(() => {
    const performInitialOfflineCheck = async () => {
      // Só executar se não temos usuário e já verificamos o estado de autenticação
      if (!user && !loading && authStateStable && !isRestoringSession && !isCheckingOfflineUser) {
        setIsCheckingOfflineUser(true);
        try {
          // Verificar se está offline
          const isOnline = await OfflineStorage.isOnline();
          
          if (!isOnline) {
            console.log("App inicializado offline, tentando recuperar usuário local");
            
            // Tentar várias estratégias para encontrar um usuário válido
            
            // 1. Primeiro, tentar obter o último usuário logado através do ID
            const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
            
            if (lastUserId) {
              console.log("Encontrado último usuário logado:", lastUserId);
              
              // 2. Tentar múltiplas fontes para os dados do usuário
              let userData = null;
              
              // Primeiro, tentar através do SecureStore
              try {
                userData = await getUserData();
              } catch (secureError) {
                console.error("Erro ao obter dados do SecureStore:", secureError);
              }
              
              // Se não encontrou, tentar diretamente do AsyncStorage
              if (!userData || !userData.uid) {
                try {
                  const rawUserData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}`);
                  if (rawUserData) {
                    userData = JSON.parse(rawUserData);
                  }
                } catch (asyncError) {
                  console.error("Erro ao obter dados do AsyncStorage:", asyncError);
                }
              }
              
              // Tentar usar o espelho de dados como última opção
              if (!userData || !userData.uid) {
                try {
                  const mirrorData = await AsyncStorage.getItem("pumpgym_user_data_mirror");
                  if (mirrorData) {
                    userData = JSON.parse(mirrorData);
                  }
                } catch (mirrorError) {
                  console.error("Erro ao obter dados do mirror:", mirrorError);
                }
              }
              
              // Se encontramos dados de usuário, restaurar o estado
              if (userData && userData.uid) {
                console.log("Encontrados dados válidos do usuário offline");
                
                // Verificar status do onboarding
                let onboardingStatus = userData.onboardingCompleted || false;
                
                try {
                  const storedStatus = await OfflineStorage.loadOnboardingStatus(userData.uid);
                  if (storedStatus !== null) {
                    onboardingStatus = storedStatus;
                  }
                } catch (onboardingError) {
                  console.error("Erro ao verificar status do onboarding:", onboardingError);
                }
                
                // Verificar status da assinatura
                let subscriptionStatus = false;
                
                try {
                  subscriptionStatus = await OfflineStorage.getSubscriptionStatus(userData.uid);
                } catch (subscriptionError) {
                  console.error("Erro ao verificar status da assinatura:", subscriptionError);
                }
                
                // Definir o usuário no estado e salvar nos locais apropriados
                setUser({
                  uid: userData.uid,
                  email: userData.email,
                  displayName: userData.displayName,
                  isAnonymous: userData.isAnonymous || false,
                } as any);
                
                setIsAnonymous(userData.isAnonymous || false);
                setIsNewUser(!onboardingStatus);
                setIsSubscribed(subscriptionStatus);
                setOnboardingCompleted(onboardingStatus);
                
                // Salvar novamente nos vários armazenamentos para garantir consistência
                await OfflineStorage.saveLastLoggedUser(userData.uid);
                await OfflineStorage.saveUserData(userData.uid, userData);
                await OfflineStorage.saveOnboardingStatus(userData.uid, onboardingStatus);
                
                // Salvar o usuário offline para uso na renderização
                setOfflineUser({
                  ...userData,
                  onboardingCompleted: onboardingStatus,
                  isSubscribed: subscriptionStatus,
                });
                
                console.log("Usuário offline restaurado com sucesso");
              }
            }
          }
        } catch (error) {
          console.error("Erro no check offline inicial:", error);
        } finally {
          setIsCheckingOfflineUser(false);
          setInitialCheckComplete(true);
        }
      } else if (!isCheckingOfflineUser) {
        // Se já temos um usuário ou ainda estamos carregando, apenas marcar como completo
        setInitialCheckComplete(true);
      }
    };
    
    performInitialOfflineCheck();
  }, [
    user, 
    loading, 
    authStateStable, 
    isRestoringSession, 
    isCheckingOfflineUser,
    setUser,
    setIsAnonymous,
    setIsNewUser,
    setIsSubscribed
  ]);

  // Verificar usuário offline quando não há usuário autenticado (comportamento original)
  useEffect(() => {
    const checkOfflineUser = async () => {
      if (!user && !loading && authStateStable && !isRestoringSession && !isCheckingOfflineUser && initialCheckComplete) {
        setIsCheckingOfflineUser(true);
        try {
          // Verificar se está offline
          const isOnline = await OfflineStorage.isOnline();

          if (!isOnline) {
            // Tentar obter último usuário logado
            const lastUserId = await AsyncStorage.getItem(
              KEYS.LAST_LOGGED_USER
            );

            if (lastUserId) {
              // Carregar dados do usuário do SecureStore
              const userData = await getUserData();

              if (userData && userData.uid) {
                // Verificar status de assinatura offline usando a função do AuthContext
                const hasSubscription = await checkOfflineSubscriptionStatus(
                  userData.uid
                );

                // Definir dados do usuário no contexto para manter sessão
                setUser({
                  uid: userData.uid,
                  email: userData.email,
                  displayName: userData.displayName,
                  isAnonymous: userData.isAnonymous || false,
                } as any);

                // Definir status de assinatura
                setIsSubscribed(hasSubscription);

                // Salvar para uso na renderização
                setOfflineUser({
                  ...userData,
                  isSubscribed: hasSubscription,
                });
              }
            }
          }
        } catch (error) {
          console.error("Erro ao verificar usuário offline:", error);
        } finally {
          setIsCheckingOfflineUser(false);
        }
      }
    };

    checkOfflineUser();
  }, [
    user,
    loading,
    authStateStable,
    isRestoringSession,
    setUser,
    setIsSubscribed,
    checkOfflineSubscriptionStatus,
    initialCheckComplete
  ]);

  // Verificar status de assinatura
  useEffect(() => {
    let isMounted = true;

    const verifySubscription = async () => {
      if (
        !user ||
        isAnonymous ||
        isCheckingSubscription ||
        hasCheckedSubscription
      ) {
        return;
      }

      setIsCheckingSubscription(true);
      try {
        await checkSubscriptionStatus();
      } catch (error) {
        console.error("Erro ao verificar assinatura:", error);
      } finally {
        if (isMounted) {
          setIsCheckingSubscription(false);
          setHasCheckedSubscription(true);
        }
      }
    };

    verifySubscription();

    return () => {
      isMounted = false;
    };
  }, [
    user,
    isAnonymous,
    isCheckingSubscription,
    hasCheckedSubscription,
    checkSubscriptionStatus,
  ]);

  // Verificar o status de onboarding quando o usuário estiver autenticado
  useEffect(() => {
    let isMounted = true;

    // Resetar o estado quando o usuário mudar
    if (!user) {
      setOnboardingCompleted(null);
      setIsCheckingOnboarding(false);
      setError(null);
      return;
    }

    const checkOnboardingStatus = async () => {
      if (!isCheckingOnboarding && onboardingCompleted === null && user) {
        setIsCheckingOnboarding(true);
        try {
          // Primeiro, tentar carregar do armazenamento local
          let completed = await OfflineStorage.loadOnboardingStatus(user.uid);

          if (isMounted && !completed) {
            // Se não encontrar localmente, verificar online apenas se ainda estiver montado
            const isOnline = await OfflineStorage.isOnline();
            if (isOnline && user.uid) {
              // Verificação adicional do user.uid
              try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && isMounted) {
                  completed = userDoc.data()?.onboardingCompleted === true;
                  // Se encontrou no Firestore, salvar localmente
                  if (completed) {
                    await OfflineStorage.saveOnboardingStatus(
                      user.uid,
                      completed
                    );
                  }
                }
              } catch (error) {
                if (isMounted) {
                  console.error("Erro ao verificar onboarding:", error);
                  // Em caso de erro na verificação online, assumir não completado
                  completed = false;
                }
              }
            }
          }

          if (isMounted) {
            setOnboardingCompleted(completed || false);
            setError(null);
          }
        } catch (error) {
          if (isMounted) {
            console.error("Erro ao verificar status do onboarding:", error);
            setOnboardingCompleted(false);
            setError("Erro ao inicializar a aplicação.");
          }
        } finally {
          if (isMounted) {
            setIsCheckingOnboarding(false);
          }
        }
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [user, isCheckingOnboarding, onboardingCompleted]);

  // Caso haja erro na inicialização
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors[theme].background,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: Colors[theme].error,
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {error}
        </Text>
        <Text
          style={{
            color: Colors[theme].text,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Por favor, tente reiniciar o aplicativo.
        </Text>
      </View>
    );
  }

  // Mostrar indicador de carregamento enquanto verifica autenticação e onboarding
  if (
    loading ||
    !authStateStable ||
    isRestoringSession ||
    !appInitialized ||
    isCheckingOfflineUser ||
    (user &&
      !isAnonymous &&
      (isCheckingOnboarding ||
        onboardingCompleted === null ||
        isCheckingSubscription))
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors[theme].background,
        }}
      >
        <ActivityIndicator size="large" color={Colors[theme].primary} />
      </View>
    );
  }

  // Se temos um usuário offline quando estamos sem internet
  if (offlineUser && !user) {
    if (!offlineUser.onboardingCompleted) {
      return <Redirect href="/onboarding/gender" />;
    }

    if (!offlineUser.isSubscribed) {
      return <Redirect href="/paywall" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  // Após o carregamento, redirecionar baseado no estado de autenticação e onboarding
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // Se usuário é anônimo, enviar para o onboarding
  if (isAnonymous) {
    return <Redirect href="/onboarding/gender" />;
  }

  // Se usuário está autenticado mas não completou onboarding
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding/gender" />;
  }

  // Se o usuário não tem assinatura, enviar para a tela de pagamento
  if (!isSubscribed) {
    return <Redirect href="/paywall" />;
  }

  // Se usuário está autenticado, completou onboarding e tem assinatura
  return <Redirect href="/(tabs)" />;
}
