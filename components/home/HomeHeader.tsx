import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";

interface HomeHeaderProps {
  title?: string;
  showContextMenu?: boolean;
  menuActions?: MenuAction[];
  menuVisible?: boolean;
}

export default function HomeHeader({
  title,
  showContextMenu = false,
  menuActions = [],
  menuVisible = true,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[styles.container, { backgroundColor: `${colors.background}E0` }]}
    >
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          {title ? (
            <Text
              style={[styles.titleText, { color: colors.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : null}
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
    height: Platform.OS === "ios" ? 65 : 55,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    position: "relative",
  },
  titleWrapper: {
    justifyContent: "center",
  },
  titleText: {
    fontSize: 30,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    fontWeight: "bold",
    textAlign: "center",
  },
  menuWrapper: {
    position: "absolute",
    right: -5,
  },
});
