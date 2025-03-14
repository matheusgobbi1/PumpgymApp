import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gerenciar a persistência de autenticação
 * Este hook deve ser usado dentro do AuthProvider
 * Nota: Usuários anônimos não têm seus dados persistidos
 */
export function useAuthPersistence() {
  const { restoreSession, authStateStable, isRestoringSession } = useAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!authStateStable && !isRestoringSession) {
        try {
          await restoreSession();
        } catch (error) {
          console.error("Erro ao restaurar sessão:", error);
        }
      }
    };

    initializeAuth();
  }, [restoreSession, authStateStable, isRestoringSession]);
}
