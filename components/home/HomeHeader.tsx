import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "../../hooks/useDateLocale";
import FitLevelBadge from "./FitLevelBadge";

const { width } = Dimensions.get("window");

type IconType = "ionicons" | "material";

interface HomeHeaderProps {
  title?: string;
  onFitLevelPress?: () => void;
  iconName?: string;
  iconType?: IconType;
  iconColor?: string;
  iconBackgroundColor?: string;
  showContextMenu?: boolean;
  menuActions?: MenuAction[];
  menuVisible?: boolean;
  showFitLevelBadge?: boolean;
}

export default function HomeHeader({
  title,
  onFitLevelPress,
  iconName = "fire",
  iconType = "material",
  iconColor,
  iconBackgroundColor,
  showContextMenu = false,
  menuActions = [],
  menuVisible = true,
  showFitLevelBadge = true,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatDateWithWeekday } = useDateLocale();

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

  // Usar useMemo para formatar a data atual usando a função centralizada
  const currentDate = useMemo(() => {
    const today = new Date();
    return formatDateWithWeekday(today);
  }, [formatDateWithWeekday]); // Depende do hook que já observa mudanças de idioma

  // Memoize o nome do usuário para garantir consistência
  const userName = useMemo(() => {
    return user?.displayName?.split(" ")[0] || t("common.user");
  }, [user?.displayName, t]);

  return (
    <View
      style={[styles.container, { backgroundColor: `${colors.background}E0` }]}
    >
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
                style={[styles.dateText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {currentDate}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {showFitLevelBadge && (
            <View style={styles.fitLevelContainer}>
              <FitLevelBadge
                size="small"
                showLevel={false}
                onPress={onFitLevelPress}
              />
            </View>
          )}

          {showContextMenu && (
            <View style={styles.menuContainer}>
              <ContextMenu
                actions={menuActions}
                isVisible={menuVisible}
                inHeader={true}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
    paddingLeft: 20,
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
    paddingRight: 20,
  },
  fitLevelContainer: {
    marginRight: 0,
  },
  menuContainer: {
    padding: 4,
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
