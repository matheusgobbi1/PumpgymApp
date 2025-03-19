import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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
    pointerEvents: "none",
  },
  text: {
    color: "white",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

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
          toValue: 0.9,
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
          paddingTop: Math.max(insets.top, 4),
          height: Math.max(insets.top + 40, 50),
        },
      ]}
    >
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text style={styles.text} numberOfLines={2}>
        Você está offline. Seus dados serão sincronizados quando a conexão for
        restaurada.
      </Text>
    </Animated.View>
  );
}
