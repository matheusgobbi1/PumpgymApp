import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Redirect } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { OfflineStorage } from "../services/OfflineStorage";
import { View, ActivityIndicator, Text } from "react-native";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";

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
  } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

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
