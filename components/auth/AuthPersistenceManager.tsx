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
  ]);

  // Este componente não renderiza nada, apenas executa o hook
  return null;
}
