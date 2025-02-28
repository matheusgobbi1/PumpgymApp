import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";

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
    // Estilo padronizado com apenas a borda colorida quando selecionado
    return {
      backgroundColor: colors.light,
      borderColor: isSelected ? colors.primary : colors.border,
      borderWidth: isSelected ? 2 : 1,
    };
  };

  const getTextColor = () => {
    return isSelected ? colors.primary : colors.text;
  };

  const handleSelect = () => {
    // Aplicar feedback tátil quando o usuário seleciona uma opção
    if (!isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
    onSelect();
  };

  return (
    <TouchableOpacity
      style={[styles.optionContainer, getContainerStyle()]}
      onPress={handleSelect}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
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
                opacity: 0.7,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
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
