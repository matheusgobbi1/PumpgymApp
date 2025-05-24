import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import ContextMenu, { MenuAction } from "../shared/ContextMenu";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

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
        <View style={styles.titleContainer}>
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
        {showContextMenu && (
          <View style={styles.menuWrapper}>
            <ContextMenu
              actions={menuActions}
              isVisible={menuVisible}
              inHeader={true}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  content: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 38,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    marginTop: 2,
    textAlign: "center",
  },
  menuWrapper: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
