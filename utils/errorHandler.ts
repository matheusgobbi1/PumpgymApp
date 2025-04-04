import { FirebaseError } from "firebase/app";

/**
 * Interface para representar erros mapeados da aplicação
 */
export interface AppError {
  code: string;
  message: string;
}

/**
 * Mapeia códigos de erro do Firebase para mensagens amigáveis em português
 */
export const AUTH_ERROR_CODES = {
  // Erros de email/senha
  "auth/invalid-email": "O endereço de email está mal formatado.",
  "auth/user-disabled":
    "Esta conta foi desativada. Entre em contato com o suporte.",
  "auth/user-not-found": "Não existe conta associada a este email.",
  "auth/wrong-password": "A senha está incorreta.",
  "auth/invalid-credential": "As credenciais fornecidas estão inválidas.",
  "auth/invalid-login-credentials":
    "Email ou senha incorretos. Verifique suas informações.",
  "auth/too-many-requests":
    "Muitas tentativas de login. Tente novamente mais tarde.",

  // Erros de criar conta
  "auth/email-already-in-use":
    "Este email já está sendo usado por outra conta.",
  "auth/weak-password": "A senha é muito fraca. Use pelo menos 6 caracteres.",
  "auth/operation-not-allowed":
    "Esta operação não está permitida. Contate o suporte.",

  // Erros de rede/servidor
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  "auth/internal-error":
    "O servidor encontrou um erro. Tente novamente mais tarde.",
  "auth/timeout":
    "A operação expirou. Verifique sua conexão e tente novamente.",

  // Outros erros
  "auth/popup-closed-by-user": "O login foi cancelado. Tente novamente.",
  "auth/cancelled-popup-request": "A operação de login foi cancelada.",
  "auth/popup-blocked": "O popup foi bloqueado pelo navegador.",
  "auth/unauthorized-domain":
    "O domínio não está autorizado para operações OAuth.",

  // Erros de redefinição de senha
  "auth/missing-email": "Por favor, informe um email para redefinir a senha.",
  "auth/missing-continue-uri":
    "Erro interno ao processar a solicitação. Tente novamente.",
  "auth/invalid-continue-uri": "O link de redirecionamento é inválido.",
  "auth/unauthorized-continue-uri":
    "O domínio do link de redirecionamento não está autorizado.",

  // Erro genérico
  default: "Ocorreu um erro. Por favor, tente novamente.",
};

/**
 * Processa erros do Firebase e retorna mensagens amigáveis
 * @param error Erro do Firebase ou qualquer erro
 * @returns Objeto AppError com código e mensagem formatados
 */
export function handleAuthError(error: unknown): AppError {
  // Se for um erro do Firebase
  if (error instanceof FirebaseError) {
    // Busca a mensagem específica para o código de erro
    const errorMessage =
      AUTH_ERROR_CODES[error.code as keyof typeof AUTH_ERROR_CODES] ||
      AUTH_ERROR_CODES.default;

    return {
      code: error.code,
      message: errorMessage,
    };
  }

  // Se for outro tipo de erro com mensagem própria
  if (error instanceof Error) {
    return {
      code: "unknown",
      message: error.message || AUTH_ERROR_CODES.default,
    };
  }

  // Erro desconhecido
  return {
    code: "unknown",
    message: AUTH_ERROR_CODES.default,
  };
}

/**
 * Processa erros de login
 * @param error Erro capturado
 * @returns Mensagem amigável para o usuário
 */
export function handleLoginError(error: unknown): string {
  const appError = handleAuthError(error);

  // Mapeamento específico para erros comuns de login
  switch (appError.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Email ou senha incorretos. Verifique suas informações e tente novamente.";

    case "auth/too-many-requests":
      return "Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.";

    case "auth/network-request-failed":
      return "Falha na conexão. Verifique sua internet e tente novamente.";

    default:
      return appError.message;
  }
}

/**
 * Processa erros de registro
 * @param error Erro capturado
 * @param onEmailExists Callback opcional para tratar email já existente
 * @returns Mensagem amigável para o usuário, ou vazio se o callback for chamado
 */
export function handleRegisterError(
  error: unknown,
  onEmailExists?: () => void
): string {
  const appError = handleAuthError(error);

  // Se houver um callback para email já existente e o erro for desse tipo
  if (
    onEmailExists &&
    (appError.code === "auth/email-already-in-use" ||
      appError.message.includes("Este email já está cadastrado"))
  ) {
    onEmailExists();
    return ""; // Retornar string vazia pois o callback vai lidar com o erro
  }

  switch (appError.code) {
    case "auth/email-already-in-use":
      return "Este email já está sendo usado. Tente fazer login ou use outro email.";

    case "auth/invalid-email":
      return "O email inserido não é válido. Por favor, verifique e tente novamente.";

    case "auth/weak-password":
      return "A senha é muito fraca. Use pelo menos 6 caracteres combinando letras, números e símbolos.";

    case "auth/network-request-failed":
      return "Falha na conexão. Verifique sua internet e tente novamente.";

    default:
      return appError.message;
  }
}

/**
 * Processa erros de recuperação de senha
 * @param error Erro capturado
 * @returns Mensagem amigável para o usuário
 */
export function handlePasswordResetError(error: unknown): string {
  const appError = handleAuthError(error);

  switch (appError.code) {
    case "auth/user-not-found":
      return "Não encontramos uma conta com este email. Verifique o endereço ou crie uma nova conta.";

    case "auth/invalid-email":
      return "O email inserido não é válido. Por favor, verifique e tente novamente.";

    case "auth/missing-email":
      return "Por favor, insira um endereço de email para redefinir sua senha.";

    case "auth/network-request-failed":
      return "Falha na conexão. Verifique sua internet e tente novamente.";

    default:
      return appError.message;
  }
}
