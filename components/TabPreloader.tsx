import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from "react-native";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import { MotiView } from "moti";

interface TabPreloaderProps {
  minHeight?: number;
  message?: string;
  showSpinner?: boolean;
  style?: ViewStyle;
  showPlaceholder?: boolean;
}

const { width, height } = Dimensions.get("window");

/**
 * Componente para exibir um carregador durante o preloading da tab
 */
const TabPreloader: React.FC<TabPreloaderProps> = ({
  minHeight = 200,
  message = "Carregando...",
  showSpinner = true,
  style,
  showPlaceholder = true,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  if (!showPlaceholder) {
    return null;
  }

  return (
    <MotiView
      style={[
        styles.container,
        {
          minHeight: height * 0.7, // Usar altura relativa à tela
          backgroundColor: colors.background,
        },
        style,
      ]}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <View style={styles.centerContent}>
        {showSpinner && (
          <ActivityIndicator size="large" color={colors.primary} />
        )}

        {message ? (
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
        ) : null}

        {/* Elementos de placeholder simulando conteúdo */}
        <View style={styles.placeholderContainer}>
          <View
            style={[
              styles.placeholder,
              styles.placeholderLarge,
              { backgroundColor: colors.light },
            ]}
          />
          <View style={styles.placeholderRow}>
            <View
              style={[
                styles.placeholder,
                styles.placeholderSmall,
                { backgroundColor: colors.light },
              ]}
            />
            <View
              style={[
                styles.placeholder,
                styles.placeholderSmall,
                { backgroundColor: colors.light },
              ]}
            />
          </View>
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    width: "100%",
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },
  placeholderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  placeholder: {
    borderRadius: 12,
    opacity: 0.3,
  },
  placeholderLarge: {
    height: 120,
    width: width - 64,
  },
  placeholderSmall: {
    height: 80,
    width: (width - 64) / 2 - 8,
  },
});

export default TabPreloader;
