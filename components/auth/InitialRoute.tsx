import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Redirect } from "expo-router";
import SplashScreen from "../common/SplashScreen";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { OfflineStorage } from "../../services/OfflineStorage";

export default function InitialRoute() {
  const { loading, authStateStable, isRestoringSession, appInitialized, user } =
    useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && !isCheckingOnboarding && onboardingCompleted === null) {
        setIsCheckingOnboarding(true);
        try {
          // Primeiro, verificar no Firestore
          const isOnline = await OfflineStorage.isOnline();
          let completed = false;

          if (isOnline) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              completed = userDoc.data().onboardingCompleted === true;
            }
          }

          // Se não estiver online ou não encontrar no Firestore, verificar no armazenamento local
          if (!completed) {
            completed = await OfflineStorage.loadOnboardingStatus(user.uid);
          }

          setOnboardingCompleted(completed);
        } catch (error) {
          console.error("Erro ao verificar status do onboarding:", error);
          setOnboardingCompleted(false);
        } finally {
          setIsCheckingOnboarding(false);
        }
      }
    };

    checkOnboardingStatus();
  }, [user, isCheckingOnboarding, onboardingCompleted]);

  // Mostrar SplashScreen enquanto carrega ou verifica onboarding
  if (
    loading ||
    !authStateStable ||
    isRestoringSession ||
    !appInitialized ||
    (user && (isCheckingOnboarding || onboardingCompleted === null))
  ) {
    return <SplashScreen />;
  }

  // Após o carregamento, redirecionar baseado no estado de autenticação e onboarding
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // Se usuário está autenticado mas não completou onboarding
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding/gender" />;
  }

  // Se usuário está autenticado e completou onboarding
  return <Redirect href="/(tabs)" />;
}
