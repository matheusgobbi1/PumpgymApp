import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

interface SelectionOptionProps {
  title: string;
  description: string;
  icon: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  variant?: "filled" | "outlined" | "bordered";
  index?: number;
}

export default function SelectionOption({
  title,
  description,
  icon,
  isSelected,
  onSelect,
  variant = "filled",
  index = 0,
}: SelectionOptionProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getContainerStyle = () => {
    return {
      backgroundColor: isSelected
        ? theme === "dark"
          ? colors.primary + "20"
          : colors.primary + "20"
        : colors.light,
      borderColor: isSelected ? colors.primary : colors.border,
      borderWidth: isSelected ? 1 : 1,
    };
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 1.03 : 1) }],
    };
  });

  const getTextColor = () => {
    return isSelected ? colors.primary : colors.text;
  };

  const handleSelect = () => {
    if (!isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
    onSelect();
  };

  // Entrada com animação - atraso baseado no índice para efeito cascata
  const entryDelay = 200 + index * 100;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(entryDelay).springify()}
    >
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.optionContainer, getContainerStyle()]}
          onPress={handleSelect}
          activeOpacity={0.7}
        >
          {icon && (
            <Animated.View
              entering={ZoomIn.delay(entryDelay + 200).duration(300)}
              style={[
                styles.iconContainer,
                isSelected && {
                  backgroundColor:
                    theme === "dark"
                      ? colors.primary + "20"
                      : colors.primary + "20",
                  borderRadius: 20,
                },
              ]}
            >
              {icon}
            </Animated.View>
          )}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.optionTitle,
                {
                  color: getTextColor(),
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
            >
              {title}
            </Text>
            {description ? (
              <Text
                style={[
                  styles.optionDescription,
                  {
                    color: colors.text,
                    opacity: isSelected ? 0.8 : 0.7,
                  },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 56,
    width: "100%",
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});
