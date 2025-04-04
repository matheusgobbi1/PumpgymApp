import * as SecureStore from "expo-secure-store";

// Chaves para armazenamento
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

// Salvar token de autenticação
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (error) {
    throw error;
  }
}

// Obter token de autenticação
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

// Remover token de autenticação
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    throw error;
  }
}

// Salvar dados do usuário
export async function saveUserData(userData: any): Promise<void> {
  try {
    const userDataString = JSON.stringify(userData);
    await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
  } catch (error) {
    throw error;
  }
}

// Obter dados do usuário
export async function getUserData(): Promise<any | null> {
  try {
    const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
    if (userDataString) {
      return JSON.parse(userDataString);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Remover dados do usuário
export async function removeUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  } catch (error) {
    throw error;
  }
}
