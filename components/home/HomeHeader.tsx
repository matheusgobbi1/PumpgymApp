import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { ptBR, enUS } from "date-fns/locale";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";
import { useTranslation } from "react-i18next";

interface HomeHeaderProps {
  onProfilePress?: () => void;
  title?: string;
  count?: number;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  showContextMenu?: boolean;
  menuActions?: MenuAction[];
  menuVisible?: boolean;
}

export default function HomeHeader({
  onProfilePress,
  title,
  count = 0,
  iconName = "flame-outline",
  iconColor,
  showContextMenu = false,
  menuActions = [],
  menuVisible = true,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Inicializar valores no render, sem useEffect
  if (greeting === "") {
    // Definir a saudação com base na hora do dia
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(t("home.greeting.morning"));
    } else if (hour >= 12 && hour < 18) {
      setGreeting(t("home.greeting.afternoon"));
    } else {
      setGreeting(t("home.greeting.evening"));
    }
  }

  // Inicializar a data atual
  if (currentDate === "") {
    const today = new Date();

    // Usar toLocaleDateString em vez de date-fns format para evitar problemas de compatibilidade
    let options: Intl.DateTimeFormatOptions;
    if (i18n.language === "pt-BR") {
      options = { weekday: "long", day: "numeric", month: "long" };
    } else {
      options = { weekday: "long", month: "long", day: "numeric" };
    }

    const formattedDate = today.toLocaleDateString(i18n.language, options);

    setCurrentDate(
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    );
  }

  // Cor do ícone (usar a fornecida ou a de aviso padrão)
  const actualIconColor = iconColor || colors.warning;

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <Text style={[styles.greeting, { color: colors.text, opacity: 0.6 }]}>
            {greeting},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName?.split(" ")[0] || t("common.user")}
          </Text>
          {title ? (
            <Text
              style={[
                styles.dateText,
                { color: colors.primary, fontWeight: "600", opacity: 1 },
              ]}
            >
              {title}
            </Text>
          ) : (
            <Text
              style={[styles.dateText, { color: colors.text, opacity: 0.7 }]}
            >
              {currentDate}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {count > 0 && (
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 200 }}
              style={[
                styles.streakContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name={iconName} size={16} color={actualIconColor} />
              <Text style={[styles.streakText, { color: colors.text }]}>
                {count}
              </Text>
            </MotiView>
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
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 300 }}
              >
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
              </MotiView>
            )
          )}
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 10,
    paddingBottom: 20,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 38,
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
  },
  menuContainer: {
    padding: 4,
  },
});
