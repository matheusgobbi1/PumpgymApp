import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { OfflineStorage } from "../../services/OfflineStorage";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";
import { getUserData } from "../../firebase/storage";

/**
 * Componente que gerencia a persistência de autenticação
 * Este componente deve ser usado dentro do AuthProvider
 */
export function AuthPersistenceManager() {
  const {
    user,
    loading,
    appInitialized,
    authStateStable,
    isRestoringSession,
    restoreSession,
    checkSubscriptionStatus,
    checkOfflineSubscriptionStatus,
    setUser,
    setIsSubscribed,
    setIsAnonymous,
    setIsNewUser,
  } = useAuth();

  // Função para verificar e restaurar a sessão do usuário quando o app voltar ao primeiro plano
  const handleActiveState = async () => {
    try {
      // Verificar se o dispositivo está online
      const isOnline = await OfflineStorage.isOnline();

      // Se não houver usuário e não estiver carregando, tenta restaurar a sessão
      if (!user && !loading && !isRestoringSession) {
        try {
          await restoreSession();
        } catch (error) {
          console.error("Erro ao restaurar sessão no handleActiveState:", error);
          
          // Se falhar e estiver offline, tentar recuperação mais agressiva
          if (!isOnline) {
            await recoverOfflineUser();
          }
        }
      }
      // Se já tem usuário, apenas verifica assinatura
      else if (user && !user.isAnonymous) {
        await checkSubscriptionStatus();
      }
      // Se estiver offline e não temos usuário após a tentativa normal, tentar recuperação manual
      else if (!isOnline && !user) {
        await recoverOfflineUser();
      }
    } catch (error) {
      console.error("Erro geral em handleActiveState:", error);
    }
  };

  // Função para tentar recuperar um usuário offline como último recurso
  const recoverOfflineUser = async () => {
    try {
      // 1. Tentar obter o ID do último usuário logado
      const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (!lastUserId) return;

      // 2. Tentar obter dados do usuário de múltiplas fontes
      let userData = null;
      
      // Primeiro verificar no SecureStore via método padrão
      userData = await getUserData();
      
      // Se não encontrar, tentar diretamente no AsyncStorage
      if (!userData || !userData.uid) {
        try {
          const storedData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}`);
          if (storedData) {
            userData = JSON.parse(storedData);
          }
        } catch (asyncError) {
          console.error("Erro ao recuperar dados direto do AsyncStorage:", asyncError);
        }
      }

      // Verificar se há um backup específico criado durante o logout
      if (!userData || !userData.uid) {
        try {
          const backupData = await AsyncStorage.getItem(`${KEYS.USER_DATA}_${lastUserId}_backup`);
          if (backupData) {
           
            userData = JSON.parse(backupData);
          }
        } catch (backupError) {
          console.error("Erro ao recuperar backup de dados:", backupError);
        }
      }

      // Tentar o backup mirror como última opção
      if (!userData || !userData.uid) {
        try {
          const mirrorData = await AsyncStorage.getItem("pumpgym_user_data_mirror");
          if (mirrorData) {
            userData = JSON.parse(mirrorData);
          }
        } catch (mirrorError) {
          console.error("Erro ao recuperar do mirror de dados:", mirrorError);
        }
      }

      // 3. Se encontramos dados válidos, restaurar o usuário manualmente
      if (userData && userData.uid) {
        
        
        // Definir o usuário no estado
        setUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          isAnonymous: userData.isAnonymous || false,
        } as any);
        
        // Definir os estados adicionais
        setIsAnonymous(userData.isAnonymous || false);
        setIsNewUser(!userData.onboardingCompleted);
        
        // Verificar status de assinatura offline
        const hasSubscription = await checkOfflineSubscriptionStatus(userData.uid);
        setIsSubscribed(hasSubscription);
        
        // Salvar novamente para garantir que todos os locais tenham os dados
        await OfflineStorage.saveLastLoggedUser(userData.uid);
        await OfflineStorage.saveUserData(userData.uid, userData);
        
        // Se recuperou de um backup, restaurar nos locais originais
        if (userData._isBackup) {
          try {
            delete userData._isBackup;
            const userDataString = JSON.stringify(userData);
            await AsyncStorage.setItem(`${KEYS.USER_DATA}_${userData.uid}`, userDataString);
            await AsyncStorage.setItem("pumpgym_user_data_mirror", userDataString);
          } catch (restoreError) {
            console.error("Erro ao restaurar dados do backup:", restoreError);
          }
        }
        
        
        return true;
      }
    } catch (error) {
      console.error("Erro fatal ao tentar recuperar usuário offline:", error);
    }
    return false;
  };

  useEffect(() => {
    // Função para restaurar sessão quando o app voltar ao primeiro plano
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        await handleActiveState();
      }
    };

    // Registrar listener para mudanças de estado do app
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Verificar inicialmente se precisamos restaurar um usuário offline
    // Isso é crucial para usuários que abrem o app sem internet
    const initialCheck = async () => {
      const isOnline = await OfflineStorage.isOnline();
      if (!isOnline && !user && authStateStable) {
        await recoverOfflineUser();
      }
    };
    
    initialCheck();

    // Cleanup: remover listener quando o componente for desmontado
    return () => {
      subscription.remove();
    };
  }, [
    user,
    loading,
    appInitialized,
    authStateStable,
    isRestoringSession,
    restoreSession,
    checkSubscriptionStatus,
    setIsSubscribed,
  ]);

  // Este componente não renderiza nada, apenas executa o hook
  return null;
}
