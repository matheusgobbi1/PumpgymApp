import React, { ReactNode, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
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
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  const getContainerStyle = () => {
    // Novo estilo com fundo azul claro e bordas coloridas quando selecionado
    return {
      backgroundColor: isSelected 
        ? (theme === 'dark' ? 'rgba(28, 154, 190, 0.1)' : 'rgba(28, 154, 190, 0.05)')
        : colors.light,
      borderColor: isSelected ? colors.primary : colors.border,
      borderWidth: isSelected ? 2 : 1,
      // Adicionar sombra sutil para dar profundidade
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
      shadowOpacity: isSelected ? 0.15 : 0.05,
      shadowRadius: isSelected ? 4 : 2,
      elevation: isSelected ? 3 : 1,
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
      key={`selection-option-${title}-${theme}`}
      style={[styles.optionContainer, getContainerStyle()]}
      onPress={handleSelect}
      activeOpacity={0.7}
    >
      {icon && (
        <View 
          key={`icon-container-${theme}`} 
          style={[
            styles.iconContainer,
            isSelected && {
              backgroundColor: theme === 'dark' ? 'rgba(28, 154, 190, 0.2)' : 'rgba(28, 154, 190, 0.1)',
              borderRadius: 20,
            }
          ]}
        >
          {icon}
        </View>
      )}
      <View key={`text-container-${theme}`} style={styles.textContainer}>
        <Text
          key={`option-title-${theme}`}
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
            key={`option-description-${theme}`}
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
