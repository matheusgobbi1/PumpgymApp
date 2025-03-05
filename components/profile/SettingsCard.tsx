import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");

interface SettingItem {
  id: string;
  title: string;
  icon: string;
  type: "toggle" | "action";
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingsCardProps {
  sections: SettingSection[];
  onPressLogout: () => void;
}

export default function SettingsCard({
  sections,
  onPressLogout,
}: SettingsCardProps) {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={item.type === "action" ? item.onPress : undefined}
        activeOpacity={item.type === "action" ? 0.7 : 1}
      >
        <View style={styles.settingIconTitle}>
          <View
            style={[
              styles.settingIconContainer,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={18}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {item.title}
          </Text>
        </View>

        {item.type === "toggle" ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: colors.border,
              true: colors.primary + "80",
            }}
            thumbColor={item.value ? colors.primary : colors.secondary}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Configurações
          </Text>
        </View>

        {/* Seções de configurações */}
        {sections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`}>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
              {section.title}
            </Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Botão de logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderTopColor: colors.border }]}
          onPress={onPressLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            Sair da Conta
          </Text>
        </TouchableOpacity>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIconTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 24,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
