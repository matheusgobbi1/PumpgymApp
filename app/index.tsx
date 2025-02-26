import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserData } from "../firebase/storage";
import SplashScreen from "../components/SplashScreen";

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

          // Verificar se há dados do usuário armazenados
          const userData = await getUserData();

          // Se o usuário estiver autenticado, redirecionar para a tela principal
          if (user) {
            console.log("Usuário autenticado, redirecionando...");

            // Verificar se o onboarding foi concluído
            if (userData && userData.onboardingCompleted === false) {
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
