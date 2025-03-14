import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * Componente que gerencia a persistência de autenticação
 * Este componente deve ser usado dentro do AuthProvider
 */
export function AuthPersistenceManager() {
  const { user, loading, appInitialized, authStateStable, isRestoringSession } =
    useAuth();

  useEffect(() => {
    if (!loading && appInitialized && authStateStable && !isRestoringSession) {
    }
  }, [loading, appInitialized, authStateStable, isRestoringSession, user]);

  // Este componente não renderiza nada, apenas executa o hook
  return null;
}
