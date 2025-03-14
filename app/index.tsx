import InitialRoute from "../components/InitialRoute";
import { useAuthPersistence } from "../hooks/useAuthPersistence";

export default function AppEntry() {
  // Garantir que a persistência de autenticação seja inicializada
  useAuthPersistence();

  // Usar o InitialRoute para controlar o fluxo de navegação
  return <InitialRoute />;
}
