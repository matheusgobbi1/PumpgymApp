// Lista de IDs de usuários que têm acesso gratuito ao app
export const FREE_USERS = [
  "Nnsw2DOZ2EUmgSsLP1JUPAhMczs2",
  "8mPOCn9L9bSHKQ8IKa8MKA2NTgJ3",
  "yjvCVBsWcjYVc57sNEpIOxvEOtg2",

  // Adicione mais IDs aqui conforme necessário
];

// Função para verificar se um usuário tem acesso gratuito
export const isFreeUser = (userId: string): boolean => {
  return FREE_USERS.includes(userId);
};
