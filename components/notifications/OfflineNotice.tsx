import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNutrition } from "../../context/NutritionContext";
import { useTranslation } from "react-i18next";
import { SyncService } from "../../services/SyncService";
import { Ionicons } from "@expo/vector-icons";
import { OfflineStorage } from "../../services/OfflineStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Definir as cores diretamente para não depender do tema
const colors = {
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
};

const OfflineNotice = () => {
  const { t } = useTranslation();
  const { isOnline, syncPendingData } = useNutrition();
  const [showNotice, setShowNotice] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

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

        setPendingChanges(pendingOps.length > 0 || modifiedDates.length > 0);
      } else {
        setPendingChanges(pendingOps.length > 0);
      }
    } catch (error) {
      console.error("Erro ao verificar operações pendentes:", error);
      setPendingChanges(false);
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
      setShowNotice(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (pendingChanges) {
      setShowNotice(true);
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
        setShowNotice(false);
      });
    }
  }, [isOnline, pendingChanges, fadeAnim]);

  // Função para iniciar sincronização manualmente
  const handleSync = async () => {
    if (!isOnline || syncing) return;

    try {
      setSyncing(true);
      setSyncSuccess(null);

      const result = await syncPendingData();

      // Verificar resultado
      const success =
        result &&
        (!result.errors || result.errors.length === 0) &&
        result.pendingOps.success &&
        result.meals.success;

      setSyncSuccess(success);

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
            setShowNotice(false);
            setSyncSuccess(null);
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncSuccess(false);
    } finally {
      setSyncing(false);
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
          backgroundColor:
            syncSuccess === true
              ? colors.success
              : syncSuccess === false
              ? colors.error
              : !isOnline
              ? colors.warning
              : colors.info,
        },
      ]}
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
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
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
