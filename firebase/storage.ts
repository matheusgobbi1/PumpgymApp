import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../constants/keys";

// Chaves para armazenamento
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";
const ASYNC_USER_DATA_KEY = "pumpgym_user_data_mirror";

// Salvar token de autenticação
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Erro ao salvar token no SecureStore:", error);
    // Tentar salvar em um local alternativo como fallback
    try {
      await AsyncStorage.setItem(`${KEYS.USER_DATA}_token`, token);
    } catch (fallbackError) {
      console.error("Erro ao salvar token no fallback:", fallbackError);
    }
  }
}

// Obter token de autenticação
export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) return token;
    
    // Se não encontrar no SecureStore, tentar o fallback
    return await AsyncStorage.getItem(`${KEYS.USER_DATA}_token`);
  } catch (error) {
    // Tentar o fallback diretamente em caso de erro
    try {
      return await AsyncStorage.getItem(`${KEYS.USER_DATA}_token`);
    } catch (fallbackError) {
      return null;
    }
  }
}

// Remover token de autenticação
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    // Também remover do fallback
    await AsyncStorage.removeItem(`${KEYS.USER_DATA}_token`);
  } catch (error) {
    // Tentar remover pelo menos do fallback
    try {
      await AsyncStorage.removeItem(`${KEYS.USER_DATA}_token`);
    } catch (fallbackError) {
      // Ignorar erro de limpeza do fallback
    }
  }
}

// Salvar dados do usuário
export async function saveUserData(userData: any): Promise<void> {
  try {
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
      
      // Salvar o ID do último usuário logado
      await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userData.uid);
      
      // Se tiver informação de onboarding, salvar também
      if (userData.onboardingCompleted !== undefined) {
        await AsyncStorage.setItem(
          `${KEYS.ONBOARDING_COMPLETED}_${userData.uid}`,
          JSON.stringify(userData.onboardingCompleted)
        );
      }
    }
  } catch (error) {
    console.error("Erro ao salvar dados do usuário:", error);
    // Tentar salvar pelo menos no AsyncStorage em caso de falha
    if (userData && userData.uid) {
      try {
        const userDataString = JSON.stringify(userData);
        await AsyncStorage.setItem(
          `${KEYS.USER_DATA}_${userData.uid}`, 
          userDataString
        );
        await AsyncStorage.setItem(ASYNC_USER_DATA_KEY, userDataString);
        await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userData.uid);
      } catch (fallbackError) {
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
    // Primeiro tentar obter do SecureStore
    const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
    if (userDataString) {
      return JSON.parse(userDataString);
    }
    
    // Se não encontrar, tentar obter do AsyncStorage
    try {
      // Tentar obter o ID do último usuário logado
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (lastUserId) {
        // Tentar obter os dados do usuário pelo ID
        const userData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}`);
        if (userData) {
          return JSON.parse(userData);
        }
      }
      
      // Como último recurso, tentar a cópia espelho
      const mirrorData = await AsyncStorage.getItem(ASYNC_USER_DATA_KEY);
      if (mirrorData) {
        return JSON.parse(mirrorData);
      }
    } catch (asyncError) {
      console.error("Erro ao recuperar dados do AsyncStorage:", asyncError);
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário do SecureStore:", error);
    
    // Em caso de erro no SecureStore, tentar somente AsyncStorage
    try {
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (lastUserId) {
        const userData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}`);
        if (userData) {
          return JSON.parse(userData);
        }
      }
      
      const mirrorData = await AsyncStorage.getItem(ASYNC_USER_DATA_KEY);
      if (mirrorData) {
        return JSON.parse(mirrorData);
      }
    } catch (asyncError) {
      // Ignorar erro do AsyncStorage, já estamos no caminho de fallback
    }
    
    return null;
  }
}

// Remover dados do usuário
export async function removeUserData(): Promise<void> {
  try {
    // Primeiro obter os dados para saber o ID do usuário
    const userData = await getUserData();
    
    // Remover do SecureStore
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    
    // Remover também do AsyncStorage
    await AsyncStorage.removeItem(ASYNC_USER_DATA_KEY);
    
    // Se tivermos o ID do usuário, remover dados específicos
    if (userData && userData.uid) {
      await AsyncStorage.removeItem(`${KEYS.USER_DATA}_${userData.uid}`);
      // Não removemos LAST_LOGGED_USER para permitir recuperação em caso de erro
    }
  } catch (error) {
    console.error("Erro ao remover dados do usuário:", error);
    // Tentar limpar pelo menos o AsyncStorage
    try {
      await AsyncStorage.removeItem(ASYNC_USER_DATA_KEY);
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (lastUserId) {
        await AsyncStorage.removeItem(`${KEYS.USER_DATA}_${lastUserId}`);
      }
    } catch (asyncError) {
      // Ignorar erro de limpeza do AsyncStorage
    }
  }
}
