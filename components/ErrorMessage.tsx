import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(255, 71, 87, 0.1)",
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      <Ionicons name="alert-circle" size={20} color="#FF4757" />
      <Text style={[styles.message, { color: "#FF4757" }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  message: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
});
