import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

interface SelectionOptionProps {
  title: string;
  description: string;
  icon: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  variant?: "filled" | "outlined" | "bordered";
}

export default function SelectionOption({
  title,
  description,
  icon,
  isSelected,
  onSelect,
  variant = "filled",
}: SelectionOptionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const getContainerStyle = () => {
    switch (variant) {
      case "filled":
        return {
          backgroundColor: isSelected ? colors.primary : colors.light,
          borderColor: isSelected ? colors.primary : colors.border,
        };
      case "outlined":
        return {
          backgroundColor: colors.light,
          borderColor: isSelected ? colors.primary : "transparent",
          borderWidth: isSelected ? 2 : 0,
        };
      case "bordered":
        return {
          backgroundColor: "transparent",
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: isSelected ? colors.primary : colors.light,
          borderColor: isSelected ? colors.primary : colors.border,
        };
    }
  };

  const getTextColor = () => {
    if (variant === "filled" && isSelected) {
      return "white";
    }
    return colors.text;
  };

  return (
    <TouchableOpacity
      style={[styles.optionContainer, getContainerStyle()]}
      onPress={onSelect}
    >
      <View style={styles.iconContainer}>{icon}</View>
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
        <Text
          style={[
            styles.optionDescription,
            {
              color:
                variant === "filled" && isSelected
                  ? "rgba(255, 255, 255, 0.8)"
                  : colors.text,
              opacity: variant === "filled" && isSelected ? 1 : 0.7,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
});
