import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../constants/keys";

// Chaves para armazenamento
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";
const ASYNC_USER_DATA_KEY = "pumpgym_user_data_mirror";
const DEVICE_FIRST_INSTALL_KEY = "device_first_install_timestamp";

// Salvar token de autenticação
export async function saveAuthToken(token: string): Promise<void> {
  try {
    console.log("Storage: Salvando token de autenticação");
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    
    // Salvar também no AsyncStorage como redundância
    await AsyncStorage.setItem(`${KEYS.USER_DATA}_token`, token);
    await AsyncStorage.setItem("pumpgym_auth_token_backup", token);
  } catch (error) {
    console.error("Erro ao salvar token no SecureStore:", error);
    // Tentar salvar em um local alternativo como fallback
    try {
      await AsyncStorage.setItem(`${KEYS.USER_DATA}_token`, token);
      await AsyncStorage.setItem("pumpgym_auth_token_backup", token);
    } catch (fallbackError) {
      console.error("Erro ao salvar token no fallback:", fallbackError);
    }
  }
}

// Obter token de autenticação
export async function getAuthToken(): Promise<string | null> {
  try {
    console.log("Storage: Buscando token de autenticação");
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) {
      console.log("Storage: Token encontrado no SecureStore");
      return token;
    }
    
    // Se não encontrar no SecureStore, tentar o fallback
    const fallbackToken = await AsyncStorage.getItem(`${KEYS.USER_DATA}_token`);
    if (fallbackToken) {
      console.log("Storage: Token encontrado no fallback primário");
      
      // Restaurar o token no SecureStore para futuras consultas
      try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, fallbackToken);
      } catch (restoreError) {
        // Ignorar erros ao restaurar
      }
      
      return fallbackToken;
    }
    
    // Tentar o segundo backup
    const backupToken = await AsyncStorage.getItem("pumpgym_auth_token_backup");
    if (backupToken) {
      console.log("Storage: Token encontrado no fallback secundário");
      // Restaurar nos outros locais
      try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, backupToken);
        await AsyncStorage.setItem(`${KEYS.USER_DATA}_token`, backupToken);
      } catch (restoreError) {
        // Ignorar erros ao restaurar
      }
      
      return backupToken;
    }
    
    console.log("Storage: Token não encontrado em nenhum local");
    return null;
  } catch (error) {
    console.error("Erro ao recuperar token do SecureStore:", error);
    // Tentar o fallback diretamente em caso de erro
    try {
      const fallbackToken = await AsyncStorage.getItem(`${KEYS.USER_DATA}_token`);
      if (fallbackToken) return fallbackToken;
      
      return await AsyncStorage.getItem("pumpgym_auth_token_backup");
    } catch (fallbackError) {
      return null;
    }
  }
}

// Remover token de autenticação
export async function removeAuthToken(): Promise<void> {
  try {
    console.log("Storage: Removendo token de autenticação");
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    // Também remover do fallback
    await AsyncStorage.removeItem(`${KEYS.USER_DATA}_token`);
    await AsyncStorage.removeItem("pumpgym_auth_token_backup");
  } catch (error) {
    // Tentar remover pelo menos do fallback
    try {
      await AsyncStorage.removeItem(`${KEYS.USER_DATA}_token`);
      await AsyncStorage.removeItem("pumpgym_auth_token_backup");
    } catch (fallbackError) {
      // Ignorar erro de limpeza do fallback
    }
  }
}

// Salvar dados do usuário
export async function saveUserData(userData: any): Promise<void> {
  try {
    console.log("Storage: Salvando dados do usuário", userData?.uid);
    
    if (!userData || !userData.uid) {
      console.error("Storage: Tentativa de salvar userData inválido:", userData);
      return;
    }
    
    // Salvar no SecureStore
    const userDataString = JSON.stringify(userData);
    await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
    
    // Também salvar no AsyncStorage para garantir consistência com OfflineStorage
    if (userData.uid) {
      // Salvar no OfflineStorage com o ID do usuário
      await AsyncStorage.setItem(
        `${KEYS.USER_DATA}_${userData.uid}`,
        userDataString
      );
      
      // Salvar como uma cópia espelho para recuperação alternativa
      await AsyncStorage.setItem(ASYNC_USER_DATA_KEY, userDataString);
      
      // Salvar uma cópia específica para este usuário
      await AsyncStorage.setItem(`pumpgym_user_${userData.uid}`, userDataString);
      
      // Salvar o ID do último usuário logado
      await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userData.uid);
      
      // Se tiver informação de onboarding, salvar também
      if (userData.onboardingCompleted !== undefined) {
        await AsyncStorage.setItem(
          `${KEYS.ONBOARDING_COMPLETED}_${userData.uid}`,
          JSON.stringify(userData.onboardingCompleted)
        );
      }
      
      // Registrar a primeira instalação do dispositivo, se ainda não existir
      const hasFirstInstall = await AsyncStorage.getItem(DEVICE_FIRST_INSTALL_KEY);
      if (!hasFirstInstall) {
        await AsyncStorage.setItem(
          DEVICE_FIRST_INSTALL_KEY, 
          new Date().toISOString()
        );
      }
      
      console.log("Storage: Dados do usuário salvos com sucesso");
    }
  } catch (error) {
    console.error("Erro ao salvar dados do usuário:", error);
    // Tentar salvar pelo menos no AsyncStorage em caso de falha
    if (userData && userData.uid) {
      try {
        console.log("Storage: Tentando salvar por fallback");
        const userDataString = JSON.stringify(userData);
        await AsyncStorage.setItem(
          `${KEYS.USER_DATA}_${userData.uid}`, 
          userDataString
        );
        await AsyncStorage.setItem(ASYNC_USER_DATA_KEY, userDataString);
        await AsyncStorage.setItem(`pumpgym_user_${userData.uid}`, userDataString);
        await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userData.uid);
        console.log("Storage: Dados salvos por fallback com sucesso");
      } catch (fallbackError) {
        console.error("Storage: Falha total ao salvar dados:", fallbackError);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}

// Obter dados do usuário
export async function getUserData(): Promise<any | null> {
  try {
    console.log("Storage: Buscando dados do usuário");
    
    // Primeiro tentar obter do SecureStore
    const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData && userData.uid) {
          console.log("Storage: Dados encontrados no SecureStore:", userData.uid);
          return userData;
        }
      } catch (parseError) {
        console.error("Erro ao analisar dados do SecureStore:", parseError);
      }
    }
    
    // Se não encontrar, tentar obter do AsyncStorage
    try {
      // Tentar obter o ID do último usuário logado
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      console.log("Storage: Último usuário logado:", lastUserId);
      
      if (lastUserId) {
        // Tentar obter os dados do usuário pelo ID
        const userData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}`);
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            console.log("Storage: Dados encontrados via ID específico:", lastUserId);
            
            // Restaurar no SecureStore para futuras consultas
            try {
              await SecureStore.setItemAsync(USER_DATA_KEY, userData);
            } catch (restoreError) {
              // Ignorar erros ao restaurar
            }
            
            return parsedData;
          } catch (parseError) {
            console.error("Erro ao analisar dados do AsyncStorage:", parseError);
          }
        }
        
        // Tentar obter dados do armazenamento específico do usuário
        const userSpecificData = await AsyncStorage.getItem(`pumpgym_user_${lastUserId}`);
        if (userSpecificData) {
          try {
            const parsedData = JSON.parse(userSpecificData);
            console.log("Storage: Dados encontrados via armazenamento específico:", lastUserId);
            
            // Restaurar nos outros locais
            try {
              await SecureStore.setItemAsync(USER_DATA_KEY, userSpecificData);
              await AsyncStorage.setItem(`${KEYS.USER_DATA}_${lastUserId}`, userSpecificData);
              await AsyncStorage.setItem(ASYNC_USER_DATA_KEY, userSpecificData);
            } catch (restoreError) {
              // Ignorar erros ao restaurar
            }
            
            return parsedData;
          } catch (parseError) {
            console.error("Erro ao analisar dados específicos do usuário:", parseError);
          }
        }
      }
      
      // Como último recurso, tentar a cópia espelho
      const mirrorData = await AsyncStorage.getItem(ASYNC_USER_DATA_KEY);
      if (mirrorData) {
        try {
          const parsedData = JSON.parse(mirrorData);
          console.log("Storage: Dados encontrados via mirror:", parsedData.uid);
          
          if (parsedData && parsedData.uid) {
            // Restaurar nos outros locais
            try {
              await SecureStore.setItemAsync(USER_DATA_KEY, mirrorData);
              await AsyncStorage.setItem(`${KEYS.USER_DATA}_${parsedData.uid}`, mirrorData);
              await AsyncStorage.setItem(`pumpgym_user_${parsedData.uid}`, mirrorData);
              await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, parsedData.uid);
            } catch (restoreError) {
              // Ignorar erros ao restaurar
            }
          }
          
          return parsedData;
        } catch (parseError) {
          console.error("Erro ao analisar dados do mirror:", parseError);
        }
      }
      
      // Se ainda não encontrou, verificar backups de logout
      if (lastUserId) {
        const backupData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}_backup`);
        if (backupData) {
          try {
            const parsedData = JSON.parse(backupData);
            console.log("Storage: Dados encontrados via backup:", lastUserId);
            
            // Restaurar nos outros locais
            if (parsedData && parsedData.uid) {
              try {
                await SecureStore.setItemAsync(USER_DATA_KEY, backupData);
                await AsyncStorage.setItem(`${KEYS.USER_DATA}_${parsedData.uid}`, backupData);
                await AsyncStorage.setItem(ASYNC_USER_DATA_KEY, backupData);
                await AsyncStorage.setItem(`pumpgym_user_${parsedData.uid}`, backupData);
              } catch (restoreError) {
                // Ignorar erros ao restaurar
              }
            }
            
            return parsedData;
          } catch (parseError) {
            console.error("Erro ao analisar dados do backup:", parseError);
          }
        }
      }
    } catch (asyncError) {
      console.error("Erro ao recuperar dados do AsyncStorage:", asyncError);
    }
    
    console.log("Storage: Nenhum dado de usuário encontrado");
    return null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário do SecureStore:", error);
    
    // Em caso de erro no SecureStore, tentar somente AsyncStorage
    try {
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      console.log("Storage: Tentativa de recuperação após erro, último usuário:", lastUserId);
      
      if (lastUserId) {
        // Tentar todas as fontes possíveis
        const sources = [
          `${KEYS.USER_DATA}_${lastUserId}`,
          `pumpgym_user_${lastUserId}`,
          `${KEYS.USER_DATA}_${lastUserId}_backup`,
          ASYNC_USER_DATA_KEY
        ];
        
        for (const source of sources) {
          try {
            const userData = await AsyncStorage.getItem(source);
            if (userData) {
              const parsedData = JSON.parse(userData);
              console.log(`Storage: Recuperação bem-sucedida de ${source}`);
              return parsedData;
            }
          } catch (sourceError) {
            // Continuar tentando outras fontes
          }
        }
      }
      
      // Última tentativa - verificar mirror
      const mirrorData = await AsyncStorage.getItem(ASYNC_USER_DATA_KEY);
      if (mirrorData) {
        try {
          return JSON.parse(mirrorData);
        } catch (parseError) {
          // Falha na última tentativa
        }
      }
    } catch (asyncError) {
      // Ignorar erro do AsyncStorage, já estamos no caminho de fallback
      console.error("Falha total na recuperação:", asyncError);
    }
    
    console.log("Storage: Falha em todas as tentativas de recuperação");
    return null;
  }
}

// Remover dados do usuário
export async function removeUserData(): Promise<void> {
  try {
    console.log("Storage: Iniciando processo de remoção de dados do usuário");
    
    // Primeiro obter os dados para saber o ID do usuário
    const userData = await getUserData();
    
    // ANTES de remover os dados do usuário, criar um backup para recuperação
    if (userData && userData.uid) {
      try {
        // Adicionar flag indicando que é um backup
        const backupData = {...userData, _isBackup: true};
        await AsyncStorage.setItem(
          `${KEYS.USER_DATA}_${userData.uid}_backup`, 
          JSON.stringify(backupData)
        );
        console.log("Storage: Criado backup de dados antes da remoção:", userData.uid);
      } catch (backupError) {
        console.error("Erro ao criar backup antes da remoção:", backupError);
      }
    }
    
    // Remover do SecureStore
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    
    // Remover também do AsyncStorage
    await AsyncStorage.removeItem(ASYNC_USER_DATA_KEY);
    
    // Se tivermos o ID do usuário, remover dados específicos
    if (userData && userData.uid) {
      await AsyncStorage.removeItem(`${KEYS.USER_DATA}_${userData.uid}`);
      await AsyncStorage.removeItem(`pumpgym_user_${userData.uid}`);
      // Não removemos LAST_LOGGED_USER para permitir recuperação em caso de erro
    }
    
    console.log("Storage: Dados do usuário removidos com sucesso");
  } catch (error) {
    console.error("Erro ao remover dados do usuário:", error);
    // Tentar limpar pelo menos o AsyncStorage
    try {
      await AsyncStorage.removeItem(ASYNC_USER_DATA_KEY);
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (lastUserId) {
        await AsyncStorage.removeItem(`${KEYS.USER_DATA}_${lastUserId}`);
        await AsyncStorage.removeItem(`pumpgym_user_${lastUserId}`);
      }
    } catch (asyncError) {
      // Ignorar erro de limpeza do AsyncStorage
      console.error("Erro ao limpar AsyncStorage:", asyncError);
    }
  }
}
