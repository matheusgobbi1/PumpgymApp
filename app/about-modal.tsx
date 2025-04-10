import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MotiView, AnimatePresence } from "moti";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

interface SocialLink {
  icon: IconName;
  url: string;
  color: string;
}

export default function AboutModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  const features: Feature[] = [
    {
      icon: "barbell-outline",
      title: "Treinos",
      description: "Acompanhe seus treinos e evolução",
    },
    {
      icon: "nutrition-outline",
      title: "Nutrição",
      description: "Controle sua dieta e macronutrientes",
    },
    {
      icon: "trending-up-outline",
      title: "Progresso",
      description: "Visualize sua evolução ao longo do tempo",
    },
    {
      icon: "calendar-outline",
      title: "Planejamento",
      description: "Organize sua rotina de treinos",
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      icon: "logo-instagram",
      url: "https://instagram.com/fitfolio.app",
      color: "#E1306C",
    },
    {
      icon: "logo-twitter",
      url: "https://twitter.com/fitfolio_app",
      color: "#1DA1F2",
    },
    {
      icon: "mail-outline",
      url: "mailto:fitfolio.app.br@gmail.com",
      color: colors.primary,
    },
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      edges={["bottom"]}
    >
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 200 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Logo Section */}
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 100 }}
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/clean-icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              FitFolio
            </Text>
            <Text style={[styles.version, { color: colors.text + "80" }]}>
              Versão {appVersion}
            </Text>
          </MotiView>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <MotiView
                key={feature.title}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 200 + index * 100 }}
                style={[styles.featureCard, { backgroundColor: colors.light }]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  {feature.description}
                </Text>
              </MotiView>
            ))}
          </View>

          {/* Social Links */}
          <View style={styles.socialLinks}>
            {socialLinks.map((link, index) => (
              <MotiView
                key={link.url}
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 600 + index * 100 }}
              >
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { backgroundColor: link.color + "15" },
                  ]}
                  onPress={() => openLink(link.url)}
                >
                  <Ionicons name={link.icon} size={24} color={link.color} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>

          {/* Footer */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 900 }}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.text + "60" }]}>
              © {new Date().getFullYear()} FitFolio
            </Text>
            <Text style={[styles.footerSubtext, { color: colors.text + "40" }]}>
              Desenvolvido por Matheus Gobbi
            </Text>
          </MotiView>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontWeight: "500",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  featureCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  socialLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 32,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
});
