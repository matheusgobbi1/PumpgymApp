import React from "react";
import { useAuthPersistence } from "../hooks/useAuthPersistence";

/**
 * Componente que gerencia a persistência de autenticação
 * Este componente deve ser usado dentro do AuthProvider
 */
export function AuthPersistenceManager() {
  // Usar o hook de persistência de autenticação
  useAuthPersistence();

  // Este componente não renderiza nada, apenas executa o hook
  return null;
}
