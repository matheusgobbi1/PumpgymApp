import { useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gerenciar a persistência de autenticação
 * Este hook deve ser usado dentro do AuthProvider
 * Nota: Usuários anônimos não têm seus dados persistidos
 */
export function useAuthPersistence() {
  const { restoreSession } = useAuth();

  const attemptSessionRestore = useCallback(async () => {
    try {
      console.log("AuthPersistenceManager: Tentando restaurar sessão");
      const result = await restoreSession();
      if (result) {
        console.log("AuthPersistenceManager: Sessão restaurada com sucesso");
      } else {
        console.log(
          "AuthPersistenceManager: Nenhuma sessão válida para restaurar"
        );
      }
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
