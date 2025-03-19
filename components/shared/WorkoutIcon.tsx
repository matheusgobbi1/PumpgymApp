import React, { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

// Tipos para os ícones
type IoniconsNames = React.ComponentProps<typeof Ionicons>["name"];
type MaterialIconNames = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];
type FontAwesome5Names = React.ComponentProps<typeof FontAwesome5>["name"];

// Tipo para o ícone do treino
export type WorkoutIconType = {
  type: "ionicons" | "material" | "fontawesome";
  name: IoniconsNames | MaterialIconNames | FontAwesome5Names;
};

interface WorkoutIconProps {
  iconType: WorkoutIconType;
  size: number;
  color: string;
}

// Componente para exibir o ícone do treino
const WorkoutIcon = ({ iconType, size, color }: WorkoutIconProps) => {
  if (!iconType) {
    // Fallback para um ícone padrão
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  // Verificar o tipo de ícone e renderizar o componente apropriado
  switch (iconType.type) {
    case "ionicons":
      return (
        <Ionicons
          name={iconType.name as IoniconsNames}
          size={size}
          color={color}
        />
      );
    case "material":
      return (
        <MaterialCommunityIcons
          name={iconType.name as MaterialIconNames}
          size={size}
          color={color}
        />
      );
    case "fontawesome":
      return (
        <FontAwesome5
          name={iconType.name as FontAwesome5Names}
          size={size}
          color={color}
        />
      );
    default:
      // Fallback para um ícone padrão
      return <Ionicons name="barbell-outline" size={size} color={color} />;
  }
};

export default memo(WorkoutIcon);
