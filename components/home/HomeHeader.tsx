import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

type IconType = "ionicons" | "material";

interface HomeHeaderProps {
  onProfilePress?: () => void;
  title?: string;
  count?: number;
  iconName?: string;
  iconType?: IconType;
  iconColor?: string;
  iconBackgroundColor?: string;
  showContextMenu?: boolean;
  menuActions?: MenuAction[];
  menuVisible?: boolean;
}

export default function HomeHeader({
  onProfilePress,
  title,
  count = 0,
  iconName = "fire",
  iconType = "material",
  iconColor,
  iconBackgroundColor,
  showContextMenu = false,
  menuActions = [],
  menuVisible = true,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // Usar useMemo para calcular saudação baseada na hora do dia
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t("home.greeting.morning");
    } else if (hour >= 12 && hour < 18) {
      return t("home.greeting.afternoon");
    } else {
      return t("home.greeting.evening");
    }
  }, [t]);

  // Usar useMemo para formatar a data atual
  const currentDate = useMemo(() => {
    const today = new Date();
    let options: Intl.DateTimeFormatOptions;

    if (i18n.language === "pt-BR") {
      options = { weekday: "long", day: "numeric", month: "long" };
    } else {
      options = { weekday: "long", month: "long", day: "numeric" };
    }

    const formattedDate = today.toLocaleDateString(i18n.language, options);
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }, [i18n.language]);

  // Cor do ícone (usar a fornecida ou a de aviso padrão)
  const actualIconColor = iconColor || "#FF1F02";

  // Cor de fundo do ícone (usar a fornecida ou padrão)
  const actualIconBackgroundColor = iconBackgroundColor || "#FF6B6B15";

  // Memoize a renderização do ícone para evitar recálculos
  const iconElement = useMemo(() => {
    if (iconType === "material") {
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={16}
          color={actualIconColor}
        />
      );
    } else {
      return (
        <Ionicons name={iconName as any} size={16} color={actualIconColor} />
      );
    }
  }, [iconType, iconName, actualIconColor]);

  // Memoize o nome do usuário para garantir consistência
  const userName = useMemo(() => {
    return user?.displayName?.split(" ")[0] || t("common.user");
  }, [user?.displayName, t]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.greetingRow}>
            <Text
              style={[styles.greeting, { color: colors.text, opacity: 0.6 }]}
              numberOfLines={1}
            >
              {greeting},
            </Text>
            <Text
              style={[styles.userName, { color: colors.text }]}
              numberOfLines={1}
            >
              {userName}
            </Text>
          </View>

          {title ? (
            <View style={styles.subtitleContainer}>
              <Text
                style={[
                  styles.titleText,
                  { color: colors.primary, fontWeight: "600", opacity: 1 },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          ) : (
            <View style={styles.subtitleContainer}>
              <Text
                style={[styles.dateText, { color: colors.text, opacity: 0.7 }]}
                numberOfLines={1}
              >
                {currentDate}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {count > 0 && (
            <View
              style={[
                styles.streakContainer,
                { backgroundColor: actualIconBackgroundColor },
              ]}
            >
              {iconElement}
              <Text style={[styles.streakText, { color: colors.text }]}>
                {count}
              </Text>
            </View>
          )}

          {showContextMenu ? (
            <View style={styles.menuContainer}>
              <ContextMenu
                actions={menuActions}
                isVisible={menuVisible}
                inHeader={true}
              />
            </View>
          ) : (
            onProfilePress && (
              <TouchableOpacity
                onPress={onProfilePress}
                style={styles.profileButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={42}
                  color={colors.primary}
                  style={{ opacity: 0.9 }}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 10,
    paddingBottom: 20,
    height: Platform.OS === "ios" ? 70 : 60, // Garantir altura fixa
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  userInfo: {
    flex: 1,
    height: 60, // Altura fixa para a área de informações
    justifyContent: "center",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    height: 26, // Altura fixa para a linha de saudação
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
    marginRight: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    height: 20, // Altura fixa para o subtítulo
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50, // Altura fixa para o lado direito
    minWidth: 50, // Garantir espaço mínimo mesmo sem elementos
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 2,
  },
  profileButton: {
    padding: 4,
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  menuContainer: {
    padding: 4,
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
