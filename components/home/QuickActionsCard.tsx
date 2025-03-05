import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  secondaryColor: string;
  onPress: () => void;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const renderActionButton = (action: QuickAction) => {
    return (
      <TouchableOpacity
        key={action.id}
        style={styles.actionButton}
        onPress={action.onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[action.color, action.secondaryColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGradient}
        >
          <Ionicons name={action.icon as any} size={24} color="white" />
        </LinearGradient>
        <Text style={[styles.actionTitle, { color: colors.text }]}>
          {action.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Ações Rápidas
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {actions.map(renderActionButton)}
        </View>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    width: "30%",
    alignItems: "center",
    marginBottom: 12,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
