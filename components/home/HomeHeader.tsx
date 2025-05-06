import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  title?: string;
  showDate?: boolean;
  showContextMenu?: boolean;
  menuActions?: MenuAction[];
  menuVisible?: boolean;
}

export default function HomeHeader({
  title,
  showDate = false,
  showContextMenu = false,
  menuActions = [],
  menuVisible = true,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { greeting, userName, formattedDate } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let currentGreeting = "";
    if (hour < 12) currentGreeting = t("home.greeting.morning");
    else if (hour < 18) currentGreeting = t("home.greeting.afternoon");
    else currentGreeting = t("home.greeting.evening");

    const dateToDisplay = showDate ? format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }) : undefined;

    let nameToDisplay = t("home.user_fallback");
    if (user?.displayName) {
      nameToDisplay = user.displayName.split(" ")[0];
    } else if (user?.email) {
      nameToDisplay = user.email.split("@")[0];
    }

    return { greeting: currentGreeting, userName: nameToDisplay, formattedDate: dateToDisplay };
  }, [t, user, showDate]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.background}F0`,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text
            style={[styles.greetingText, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {greeting}, <Text style={styles.userNameText}>{userName}</Text>
          </Text>
          {formattedDate && (
            <Text
              style={[styles.dateText, { color: colors.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formattedDate}
            </Text>
          )}
          {title && (
            <Text
              style={[styles.titleText, { color: colors.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          )}
        </View>
        <View style={styles.menuWrapper}>
          {showContextMenu && (
            <ContextMenu
              actions={menuActions}
              isVisible={menuVisible}
              inHeader={true}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flexShrink: 1,
    justifyContent: "center",
    marginRight: 10,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay-Italic",
    marginBottom: 2,
  },
  userNameText: {
    fontFamily: "PlayfairDisplay-Italic",
  },
  dateText: {
    fontSize: 20,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  titleText: {
    fontSize: 20,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    marginTop: 2,
  },
  menuWrapper: {
    alignSelf: "center",
  },
});