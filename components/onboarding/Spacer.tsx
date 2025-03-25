import React from "react";
import { View } from "react-native";
import { SPACING } from "./OnboardingStyles";

interface SpacerProps {
  size?: keyof typeof SPACING | number;
  horizontal?: boolean;
}

/**
 * Componente para criar espaçamento consistente entre elementos
 * @param size Tamanho do espaço (xs, sm, md, lg, xl, xxl) ou valor numérico
 * @param horizontal Define se o espaçamento é horizontal ou vertical
 */
export default function Spacer({
  size = "md",
  horizontal = false,
}: SpacerProps) {
  // Determinar o valor do espaçamento
  const spacingValue = typeof size === "string" ? SPACING[size] : size;

  return (
    <View
      style={
        horizontal
          ? { width: spacingValue, height: "100%" }
          : { height: spacingValue, width: "100%" }
      }
    />
  );
}
