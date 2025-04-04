import React, { useReducer, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNutrition } from "../../context/NutritionContext";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { OfflineStorage } from "../../services/OfflineStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Estado inicial para o reducer
const initialState = {
  showNotice: false,
  pendingChanges: false,
  syncing: false,
  syncSuccess: null as boolean | null,
  fadeAnim: new Animated.Value(0),
};

// Definição dos tipos para o reducer
type OfflineState = typeof initialState;

type OfflineAction =
  | { type: "SET_PENDING_CHANGES"; payload: boolean }
  | { type: "SET_SHOW_NOTICE"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "SET_SYNC_SUCCESS"; payload: boolean | null };

// Reducer para gerenciar estados relacionados
function offlineReducer(
  state: OfflineState,
  action: OfflineAction
): OfflineState {
  switch (action.type) {
    case "SET_PENDING_CHANGES":
      return { ...state, pendingChanges: action.payload };
    case "SET_SHOW_NOTICE":
      return { ...state, showNotice: action.payload };
    case "SET_SYNCING":
      return { ...state, syncing: action.payload };
    case "SET_SYNC_SUCCESS":
      return { ...state, syncSuccess: action.payload };
    default:
      return state;
  }
}

const OfflineNotice = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isOnline, syncPendingData } = useNutrition();

  const [state, dispatch] = useReducer(offlineReducer, {
    ...initialState,
    fadeAnim: new Animated.Value(0),
  });

  const { showNotice, pendingChanges, syncing, syncSuccess, fadeAnim } = state;

  // Verificar se há operações pendentes
  const checkPendingOperations = async () => {
    try {
      const pendingOps = await OfflineStorage.getPendingOperations();

      // Verificar se há datas de refeições modificadas
      const userData = await AsyncStorage.getItem("pumpgym_user_data");
      if (userData) {
        const user = JSON.parse(userData);
        const modifiedDatesKey = `@meals:${user.uid}:modified_dates`;
        const modifiedDatesStr = await AsyncStorage.getItem(modifiedDatesKey);
        const modifiedDates = modifiedDatesStr
          ? JSON.parse(modifiedDatesStr)
          : [];

        dispatch({
          type: "SET_PENDING_CHANGES",
          payload: pendingOps.length > 0 || modifiedDates.length > 0,
        });
      } else {
        dispatch({
          type: "SET_PENDING_CHANGES",
          payload: pendingOps.length > 0,
        });
      }
    } catch (error) {
      dispatch({ type: "SET_PENDING_CHANGES", payload: false });
    }
  };

  // Efeito para atualizar a visibilidade da notificação
  useEffect(() => {
    // Verificar operações pendentes quando o componente montar
    checkPendingOperations();

    // Verificar periodicamente
    const interval = setInterval(checkPendingOperations, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, []);

  // Efeito para mostrar/esconder notificação com base no estado da conexão
  useEffect(() => {
    if (!isOnline) {
      dispatch({ type: "SET_SHOW_NOTICE", payload: true });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (pendingChanges) {
      dispatch({ type: "SET_SHOW_NOTICE", payload: true });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        dispatch({ type: "SET_SHOW_NOTICE", payload: false });
      });
    }
  }, [isOnline, pendingChanges, fadeAnim]);

  // Função para iniciar sincronização manualmente
  const handleSync = async () => {
    if (!isOnline || syncing) return;

    try {
      dispatch({ type: "SET_SYNCING", payload: true });
      dispatch({ type: "SET_SYNC_SUCCESS", payload: null });

      const result = await syncPendingData();

      // Verificar resultado
      const success =
        result &&
        (!result.errors || result.errors.length === 0) &&
        result.pendingOps.success &&
        result.meals.success;

      dispatch({ type: "SET_SYNC_SUCCESS", payload: success });

      // Atualizar estado de pendências
      await checkPendingOperations();

      // Esconder notificação de sucesso após 3 segundos
      if (success && !pendingChanges) {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            dispatch({ type: "SET_SHOW_NOTICE", payload: false });
            dispatch({ type: "SET_SYNC_SUCCESS", payload: null });
          });
        }, 3000);
      }
    } catch (error) {
      dispatch({ type: "SET_SYNC_SUCCESS", payload: false });
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  };

  // Não mostrar nada se não houver notificação para exibir
  if (!showNotice) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          paddingTop: insets.top,
          backgroundColor: !isOnline
            ? "rgba(220, 38, 38, 0.85)" // Vermelho transparente para offline
            : pendingChanges
            ? "rgba(234, 88, 12, 0.85)" // Laranja transparente para pendências
            : syncSuccess === true
            ? "rgba(22, 163, 74, 0.85)" // Verde transparente para sucesso
            : "rgba(220, 38, 38, 0.85)", // Vermelho transparente para erro
        },
      ]}
      pointerEvents="box-none" // Permite toques por baixo do componente
    >
      <View style={styles.content}>
        <Ionicons
          name={
            syncSuccess === true
              ? "checkmark-circle"
              : syncSuccess === false
              ? "alert-circle"
              : !isOnline
              ? "cloud-offline"
              : "cloud-upload"
          }
          size={20}
          color="#fff"
        />
        <Text style={styles.text}>
          {syncSuccess === true
            ? t("Dados sincronizados com sucesso")
            : syncSuccess === false
            ? t("Erro ao sincronizar dados")
            : !isOnline
            ? t("Você está trabalhando offline")
            : t("Alterações pendentes para sincronização")}
        </Text>
      </View>

      {isOnline && pendingChanges && !syncSuccess && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.buttonText}>
            {syncing ? t("Sincronizando...") : t("Sincronizar")}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  text: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default OfflineNotice;
