import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import ButtonNew from "../components/common/ButtonNew";

export default function PrivacyModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  // Estados para os switches de privacidade
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Função para voltar
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Função para alternar um switch com feedback tátil
  const toggleSwitch = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  // Função para navegar para a tela de alteração de senha
  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Implementar navegação para tela de alteração de senha
    console.log("Navegar para alteração de senha");
  };

  // Função para navegar para a tela de exclusão de conta
  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar navegação para tela de exclusão de conta
    console.log("Navegar para exclusão de conta");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Cabeçalho */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Privacidade e Segurança
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Configurações de Privacidade
          </Text>

          {/* Compartilhamento de Dados */}
          <View
            style={[styles.optionItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.optionInfo}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Compartilhamento de Dados
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Permitir compartilhamento de dados anônimos para melhorar o
                  app
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + "70" }}
              thumbColor={
                dataSharingEnabled ? colors.primary : colors.text + "30"
              }
              ios_backgroundColor={colors.border}
              onValueChange={(value) =>
                toggleSwitch(setDataSharingEnabled, value)
              }
              value={dataSharingEnabled}
            />
          </View>

          {/* Analytics */}
          <View
            style={[styles.optionItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.optionInfo}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="analytics-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Analytics
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Permitir coleta de dados de uso para melhorar a experiência
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + "70" }}
              thumbColor={
                analyticsEnabled ? colors.primary : colors.text + "30"
              }
              ios_backgroundColor={colors.border}
              onValueChange={(value) =>
                toggleSwitch(setAnalyticsEnabled, value)
              }
              value={analyticsEnabled}
            />
          </View>

          <Text
            style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}
          >
            Segurança da Conta
          </Text>

          {/* Alterar Senha */}
          <ButtonNew
            title="Alterar Senha"
            onPress={handleChangePassword}
            variant="ghost"
            iconName="key-outline"
            iconPosition="left"
            style={{ marginVertical: 8, borderRadius: 12 }}
            textStyle={{ fontSize: 16, fontWeight: "500" }}
            hapticFeedback="impact"
            hapticIntensity="light"
          />

          {/* Excluir Conta */}
          <ButtonNew
            title="Excluir Conta"
            onPress={handleDeleteAccount}
            variant="danger"
            iconName="trash-outline"
            iconPosition="left"
            style={{ marginVertical: 8, borderRadius: 12, marginTop: 8 }}
            textStyle={{ fontSize: 16, fontWeight: "500" }}
            hapticFeedback="impact"
            hapticIntensity="medium"
          />

          <Text style={[styles.disclaimer, { color: colors.text + "60" }]}>
            Suas informações são protegidas de acordo com nossa Política de
            Privacidade. Você pode solicitar a exclusão de seus dados a qualquer
            momento.
          </Text>
        </ScrollView>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 14,
    marginTop: 24,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
