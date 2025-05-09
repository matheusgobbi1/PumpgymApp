import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { OfflineStorage } from "../../services/OfflineStorage";
import { AppState, AppStateStatus } from "react-native";

/**
 * Componente que gerencia a persistência de autenticação
 * Este componente deve ser usado dentro do AuthProvider
 */
export function AuthPersistenceManager() {
  const {
    user,
    loading,
    appInitialized,
    authStateStable,
    isRestoringSession,
    restoreSession,
    checkSubscriptionStatus,
    setIsSubscribed,
  } = useAuth();

  useEffect(() => {
    // Função para restaurar sessão quando o app voltar ao primeiro plano
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // Verificar se o dispositivo está online
        const isOnline = await OfflineStorage.isOnline();

        // Se não houver usuário e não estiver carregando, tenta restaurar a sessão
        if (!user && !loading && !isRestoringSession) {
          await restoreSession();
        }
        // Se já tem usuário, verifica assinatura (online ou offline)
        else if (user && !user.isAnonymous) {
          await checkSubscriptionStatus();
        }
        // Se estiver offline, tenta recuperar status do usuário e assinatura localmente
        else if (!isOnline && !user) {
          try {
            // Carregar último usuário conhecido do armazenamento local
            const userData = await OfflineStorage.loadUserData("");
            if (userData && userData.uid) {
              // Verificar status de assinatura local
              const hasSubscription =
                await OfflineStorage.getSubscriptionStatus(userData.uid);
              setIsSubscribed(hasSubscription);
            }
          } catch (error) {
            console.error("Erro ao restaurar dados offline:", error);
          }
        }
      }
    };

    // Registrar listener para mudanças de estado do app
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup: remover listener quando o componente for desmontado
    return () => {
      subscription.remove();
    };
  }, [
    user,
    loading,
    appInitialized,
    authStateStable,
    isRestoringSession,
    restoreSession,
    checkSubscriptionStatus,
    setIsSubscribed,
  ]);

  // Este componente não renderiza nada, apenas executa o hook
  return null;
}
