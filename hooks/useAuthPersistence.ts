import { useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gerenciar a persistência de autenticação
 * Este hook deve ser usado dentro do AuthProvider
 */
export function useAuthPersistence() {
  const { restoreSession } = useAuth();

  const attemptSessionRestore = useCallback(async () => {
    try {
      console.log("AuthPersistenceManager: Tentando restaurar sessão");
      const result = await restoreSession();
      console.log(
        `AuthPersistenceManager: Restauração de sessão ${
          result ? "bem-sucedida" : "falhou"
        }`
      );
    } catch (error) {
      console.error("AuthPersistenceManager: Erro ao restaurar sessão:", error);
    }
  }, [restoreSession]);

  useEffect(() => {
    console.log(
      "AuthPersistenceManager: Inicializando gerenciamento de persistência"
    );
    attemptSessionRestore();
  }, [attemptSessionRestore]);
}
