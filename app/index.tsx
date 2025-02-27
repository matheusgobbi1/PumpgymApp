import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserData } from "../firebase/storage";
import SplashScreen from "../components/SplashScreen";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { OfflineStorage } from "../services/OfflineStorage";

export default function AppEntry() {
  const router = useRouter();
  const { user, loading, sessionRestoreAttempted } = useAuth();

  // Efeito para redirecionar o usuário com base no estado de autenticação
  useEffect(() => {
    const redirectUser = async () => {
      // Só tentamos redirecionar quando não estamos carregando e a tentativa de restauração de sessão já foi feita
      if (!loading && sessionRestoreAttempted) {
        try {
          console.log("Decidindo para onde redirecionar o usuário...");

          // Se o usuário estiver autenticado, redirecionar para a tela principal ou onboarding
          if (user) {
            console.log("Usuário autenticado, redirecionando...");

            // Verificar se o onboarding foi concluído
            let onboardingCompleted = false;

            // Primeiro, verificar no Firestore
            try {
              const isOnline = await OfflineStorage.isOnline();

              if (isOnline) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                  onboardingCompleted =
                    userDoc.data().onboardingCompleted === true;
                }
              }

              // Se não estiver online ou não encontrar no Firestore, verificar no armazenamento local
              if (!onboardingCompleted) {
                onboardingCompleted = await OfflineStorage.loadOnboardingStatus(
                  user.uid
                );
              }
            } catch (error) {
              console.error("Erro ao verificar status do onboarding:", error);
            }

            if (!onboardingCompleted) {
              console.log("Redirecionando para onboarding...");
              router.replace("/onboarding/gender");
            } else {
              console.log("Redirecionando para tela principal...");
              router.replace("/(tabs)");
            }
          }
          // Se não houver usuário autenticado
          else {
            console.log(
              "Nenhum usuário autenticado, redirecionando para login..."
            );
            router.replace("/auth/login");
          }
        } catch (error) {
          console.error("Erro ao redirecionar usuário:", error);
          router.replace("/auth/login");
        }
      }
    };

    redirectUser();
  }, [user, loading, sessionRestoreAttempted]);

  // Enquanto estamos carregando ou verificando autenticação, mostrar a SplashScreen
  return <SplashScreen />;
}
