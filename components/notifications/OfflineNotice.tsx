import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function OfflineNotice() {
  const { isOnline } = useNutrition();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isOnline) {
      // Vibrar para alertar o usuário
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Animar a entrada do aviso
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animar a saída do aviso
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          paddingTop: insets.top > 0 ? insets.top : 10,
        },
      ]}
    >
      <Ionicons name="cloud-offline" size={24} color="white" />
      <Text style={styles.text}>
        Você está offline. Seus dados serão salvos localmente e sincronizados
        quando a conexão for restaurada.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 1000,
    width,
  },
  text: {
    color: "white",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
