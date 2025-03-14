import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import Constants from "expo-constants";
import ButtonNew from "../components/common/ButtonNew";

export default function AboutModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

  // Versão do aplicativo
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  // Função para voltar
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Função para abrir links externos
  const openLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
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
            Sobre Nós
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Logo e Informações do App */}
          <View style={styles.appInfoContainer}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Image
                source={require("../assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              Fitfolio
            </Text>
            <Text style={[styles.appVersion, { color: colors.text + "70" }]}>
              Versão {appVersion}
            </Text>
            <Text
              style={[styles.appDescription, { color: colors.text + "90" }]}
            >
              Seu aplicativo completo para acompanhamento de treinos e nutrição
            </Text>
          </View>

          {/* Missão */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Nossa Missão
            </Text>
            <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
              Ajudar pessoas a alcançarem seus objetivos de saúde e fitness
              através de uma plataforma intuitiva e personalizada. Acreditamos
              que todos merecem ter acesso a ferramentas que os ajudem a viver
              uma vida mais saudável e ativa.
            </Text>
          </View>

          {/* Recursos */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Principais Recursos
            </Text>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="barbell-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Acompanhamento de Treinos
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Registre seus treinos, acompanhe seu progresso e visualize
                  estatísticas detalhadas
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="nutrition-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Controle Nutricional
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Registre suas refeições, acompanhe macronutrientes e
                  mantenha-se dentro das suas metas
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Análise de Progresso
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Visualize seu progresso ao longo do tempo com gráficos e
                  estatísticas detalhadas
                </Text>
              </View>
            </View>
          </View>

          {/* Redes Sociais */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              onPress={() => openLink("https://instagram.com/fitfolio.app")}
              style={[
                styles.socialButtonWrapper,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <FontAwesome5 name="instagram" size={24} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openLink("https://tiktok.com/@fitfolio.app")}
              style={[
                styles.socialButtonWrapper,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <FontAwesome5 name="tiktok" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Contato */}
          <View style={styles.contactButtonContainer}>
            <ButtonNew
              title="Entre em Contato"
              onPress={() => openLink("mailto:fitfolio.app.br@gmail.com")}
              variant="primary"
              iconName="mail-outline"
              iconPosition="left"
              style={styles.contactButton}
              elevation={2}
            />
          </View>

          {/* Copyright */}
          <Text style={[styles.copyright, { color: colors.text + "60" }]}>
            © {new Date().getFullYear()} Fitfolio. Todos os direitos reservados.
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
  appInfoContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 32,
    gap: 16,
  },
  socialButtonWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contactButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  contactButton: {
    width: "100%",
  },
  copyright: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 16,
  },
});
