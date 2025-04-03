import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import Constants from "expo-constants";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../context/LanguageContext";

interface ProfileOptionsCardProps {
  onThemeToggle: () => void;
  onAboutPress?: () => void;
}

export default function ProfileOptionsCard({
  onThemeToggle,
  onAboutPress = () => {},
}: ProfileOptionsCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signOut } = useAuth();
  const { currentLanguage, changeLanguage, isSwitchingLanguage } =
    useLanguage();

  // Estado para controlar a visibilidade dos modais
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Versão do aplicativo
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  // Função para alternar o idioma
  const toggleLanguage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLang = currentLanguage === "pt-BR" ? "en-US" : "pt-BR";
    await changeLanguage(newLang);
  };

  // Função para mostrar o modal de confirmação de logout
  const showLogoutConfirmation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLogoutModalVisible(true);
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Opções do Perfil */}
      <View
        style={[
          styles.optionsContainer,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Sobre Nós */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAboutPress();
          }}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>
            {t("profile.options.aboutUs")}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.text + "50"}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Alternar Idioma */}
        <TouchableOpacity style={styles.optionItem} onPress={toggleLanguage}>
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="language-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>
            {currentLanguage === "pt-BR" ? "English" : "Português"}
          </Text>
          <View
            style={[
              styles.languageIndicator,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Text style={[styles.languageCode, { color: colors.primary }]}>
              {currentLanguage === "pt-BR" ? "PT" : "EN"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Alternar Tema */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onThemeToggle();
          }}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: theme === "dark" ? "#FFD16615" : "#6C757D15" },
            ]}
          >
            <Ionicons
              name={theme === "dark" ? "sunny-outline" : "moon-outline"}
              size={20}
              color={theme === "dark" ? "#FFD166" : "#6C757D"}
            />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>
            {theme === "dark"
              ? t("profile.options.lightMode")
              : t("profile.options.darkMode")}
          </Text>
          <View
            style={[
              styles.themeToggle,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <View
              style={[
                styles.themeToggleIndicator,
                {
                  backgroundColor: colors.primary,
                  alignSelf: theme === "dark" ? "flex-end" : "flex-start",
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Sair */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={showLogoutConfirmation}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: "#EF476F15" },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF476F" />
          </View>
          <Text style={[styles.optionText, { color: "#EF476F" }]}>
            {t("profile.options.logout")}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.text + "50"}
          />
        </TouchableOpacity>
      </View>

      {/* Rodapé com informações do app */}
      <View style={styles.footerContainer}>
        <Text style={[styles.appName, { color: colors.text + "60" }]}>
          {t("profile.footer.appName")}
        </Text>
        <Text style={[styles.appVersion, { color: colors.text + "40" }]}>
          {t("profile.footer.version")} {appVersion}
        </Text>
      </View>

      {/* Modal de confirmação de logout */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title={t("profile.logoutModal.title")}
        message={t("profile.logoutModal.message")}
        confirmText={t("profile.logoutModal.confirmText")}
        cancelText={t("profile.logoutModal.cancelText")}
        confirmType="danger"
        icon="log-out-outline"
        onConfirm={() => {
          setLogoutModalVisible(false);
          handleLogout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.1,
  },
  themeToggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  themeToggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  languageIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  languageCode: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  appVersion: {
    fontSize: 12,
    marginTop: 2,
  },
});
