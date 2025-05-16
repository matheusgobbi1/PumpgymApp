import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Animated,
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
import { useRouter } from "expo-router";
import { Linking } from "react-native";

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
  const { signOut, deleteAccount } = useAuth();
  const { currentLanguage, changeLanguage, isSwitchingLanguage } =
    useLanguage();
  const router = useRouter();

  // Estado para controlar a visibilidade dos modais
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));

  // Versão do aplicativo
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  // Função para alternar o idioma
  const toggleLanguage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLang = currentLanguage === "pt-BR" ? "en-US" : "pt-BR";
    await changeLanguage(newLang);
  };

  // Função para mostrar o modal de configuração de distribuição
  const handleConfigureDistribution = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/meal-distribution-config");
  };

  // Função para mostrar o modal de confirmação de logout
  const showLogoutConfirmation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLogoutModalVisible(true);
  };

  // Função para mostrar o modal de exclusão de conta
  const showDeleteAccountConfirmation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteAccountModalVisible(true);
    setPassword("");
    setDeleteError("");
  };

  // Função para lidar com a exclusão da conta
  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError("Por favor, insira sua senha");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAccount(password);
      setDeleteAccountModalVisible(false);
    } catch (error: any) {
      // Tratar diferentes erros
      if (error.code === "auth/wrong-password") {
        setDeleteError("Senha incorreta");
      } else if (error.code === "auth/too-many-requests") {
        setDeleteError("Muitas tentativas. Tente novamente mais tarde");
      } else if (error.code === "auth/network-request-failed") {
        setDeleteError("Erro de conexão. Verifique sua internet");
      } else {
        setDeleteError(error.message || "Erro ao excluir conta");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
    } catch (error) {}
  };

  // Função para alternar a visibilidade das opções avançadas
  const toggleAdvancedOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAdvancedOptions(!showAdvancedOptions);
    Animated.timing(expandAnimation, {
      toValue: showAdvancedOptions ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
              { backgroundColor: colors.accentGray + "15" },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.accentGray}
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

        {/* Termos de Uso */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/");
          }}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: colors.accentGray + "15" },
            ]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.accentGray} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}> 
            {t("profile.options.termsOfUse")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + "50"} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Política de Privacidade */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/privacy-policy");
          }}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: colors.accentGray + "15" },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accentGray} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}> 
            {t("profile.options.privacyPolicy")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + "50"} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Opções Avançadas (expansível) */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={toggleAdvancedOptions}
        >
          <View
            style={[
              styles.optionIconContainer,
              { backgroundColor: colors.accentGray + "15" },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.accentGray} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>
            {currentLanguage === "pt-BR" ? "Opções avançadas" : "Advanced options"}
          </Text>
          <Ionicons
            name={showAdvancedOptions ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.text + "50"}
          />
        </TouchableOpacity>

        {/* Opções expansíveis */}
        {showAdvancedOptions && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Alternar Idioma */}
            <TouchableOpacity style={[styles.optionItem, styles.nestedOption]} onPress={toggleLanguage}>
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: colors.accentGray + "15" },
                ]}
              >
                <Ionicons
                  name="language-outline"
                  size={20}
                  color={colors.accentGray}
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
              style={[styles.optionItem, styles.nestedOption]}
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
              style={[styles.optionItem, styles.nestedOption]}
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

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Excluir Conta */}
            <TouchableOpacity
              style={[styles.optionItem, styles.nestedOption]}
              onPress={showDeleteAccountConfirmation}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: "#FF000015" },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color="#FF0000" />
              </View>
              <Text style={[styles.optionText, { color: "#FF0000" }]}>
                {currentLanguage === "pt-BR" ? "Excluir conta" : "Delete account"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.text + "50"}
              />
            </TouchableOpacity>
          </>
        )}
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

      {/* Modal de exclusão de conta */}
      <ConfirmationModal
        visible={deleteAccountModalVisible}
        title={currentLanguage === "pt-BR" ? "Excluir conta" : "Delete account"}
        message={
          currentLanguage === "pt-BR"
            ? "Esta ação é permanente. Todos os seus dados serão perdidos. Para confirmar, digite sua senha:"
            : "This action is permanent. All your data will be lost. To confirm, enter your password:"
        }
        confirmText={currentLanguage === "pt-BR" ? "Excluir" : "Delete"}
        cancelText={currentLanguage === "pt-BR" ? "Cancelar" : "Cancel"}
        confirmType="danger"
        icon="trash-outline"
        customContent={
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                { 
                  backgroundColor: colors.card + "50", 
                  color: colors.text,
                  borderColor: deleteError ? "#FF0000" : colors.border
                }
              ]}
              placeholder={currentLanguage === "pt-BR" ? "Sua senha" : "Your password"}
              placeholderTextColor={colors.text + "50"}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {deleteError ? (
              <Text style={styles.errorText}>{deleteError}</Text>
            ) : null}
          </View>
        }
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountModalVisible(false)}
        isLoading={isDeleting}
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
  nestedOption: {
    backgroundColor: "rgba(0,0,0,0.02)",
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
  passwordContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  passwordInput: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
