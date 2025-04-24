import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { OfflineStorage } from "../services/OfflineStorage";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

/**
 * Hook para gerenciar a persistência de autenticação
 * Este hook deve ser usado dentro do AuthProvider
 * Nota: Usuários anônimos não têm seus dados persistidos
 */
export function useAuthPersistence() {
  const { restoreSession, authStateStable, isRestoringSession, user } =
    useAuth();
  const hasRestoredRef = useRef(false);
  const unsubscribeNetInfo = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!authStateStable && !isRestoringSession && !hasRestoredRef.current) {
        try {
          const success = await restoreSession();
          hasRestoredRef.current = true;

          // Configurar listener de conectividade de rede
          unsubscribeNetInfo.current = NetInfo.addEventListener((state) => {
            // Quando a conexão com a internet for restaurada e não houver usuário,
            // tenta restaurar a sessão novamente
            if (state.isConnected && !user) {
              restoreSession();
            }
          });
        } catch (error) {
          // Tratar erro silenciosamente
        }
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de estado do app
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && !user) {
        // Quando o app voltar para o primeiro plano e não houver usuário,
        // tenta restaurar a sessão
        restoreSession();
      }
    });

    return () => {
      // Limpar listeners ao desmontar
      subscription.remove();
      if (unsubscribeNetInfo.current) {
        unsubscribeNetInfo.current();
      }
    };
  }, [restoreSession, authStateStable, isRestoringSession, user]);
}
