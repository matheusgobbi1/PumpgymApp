import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import AchievementBadge from "./AchievementBadge";
import RarityEffects from "./RarityEffects";
import { Achievement } from "../../constants/achievementsDatabase";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AchievementDetailsModalProps {
  visible: boolean;
  achievement: Achievement | null;
  currentValue: number;
  isUnlocked: boolean;
  onClose: () => void;
}

export default function AchievementDetailsModal({
  visible,
  achievement,
  currentValue,
  isUnlocked,
  onClose,
}: AchievementDetailsModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Animação para brilho da borda
  const borderOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    if (
      isUnlocked &&
      achievement?.rarity &&
      ["epic", "legendary"].includes(achievement.rarity)
    ) {
      borderOpacity.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, // infinito
        true // yoyo
      );
    }
  }, [isUnlocked, achievement?.rarity]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      opacity: borderOpacity.value,
    };
  });

  // Se não tiver conquista selecionada, não renderiza nada
  if (!achievement) return null;

  const isSecret = achievement.hidden && !isUnlocked;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Função para obter o gradiente com base na raridade
  const getRarityGradient = () => {
    if (!isUnlocked) return null;

    // Opacidades ajustadas com base no tema
    const opacityBase = theme === "dark" ? 1 : 2; // Fator multiplicador para o modo claro

    switch (achievement.rarity) {
      case "common":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(200, 200, 200, 0.05)"
                : "rgba(230, 230, 230, 0.35)",
            ]}
            style={styles.rarityGradientBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        );
      case "uncommon":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(100, 185, 100, 0.1)"
                : "rgba(100, 185, 100, 0.25)",
            ]}
            style={styles.rarityGradientBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        );
      case "rare":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(83, 135, 223, 0.15)"
                : "rgba(83, 135, 223, 0.3)",
            ]}
            style={styles.rarityGradientBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        );
      case "epic":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(167, 89, 216, 0.2)"
                : "rgba(167, 89, 216, 0.35)",
            ]}
            style={styles.rarityGradientBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        );
      case "legendary":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(251, 166, 28, 0.1)"
                : "rgba(251, 166, 28, 0.15)",
              theme === "dark"
                ? "rgba(251, 166, 28, 0.2)"
                : "rgba(251, 166, 28, 0.4)",
            ]}
            style={styles.rarityGradientBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        );
      default:
        return null;
    }
  };

  // Função para obter elementos de borda com base na raridade
  const getRarityBorderElement = () => {
    if (!isUnlocked) return null;

    // Agora aplicamos para todas as raridades, não apenas épicas e legendárias
    switch (achievement.rarity) {
      case "common":
        return theme === "light" ? (
          <LinearGradient
            colors={["transparent", "rgba(180, 180, 180, 0.6)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.rarityBorder, styles.rarityBorderLight]}
          />
        ) : null;
      case "uncommon":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(100, 185, 100, 0.5)"
                : "rgba(100, 185, 100, 0.7)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.rarityBorder,
              theme === "light" && styles.rarityBorderLight,
            ]}
          />
        );
      case "rare":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark"
                ? "rgba(83, 135, 223, 0.5)"
                : "rgba(83, 135, 223, 0.7)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.rarityBorder,
              theme === "light" && styles.rarityBorderLight,
            ]}
          />
        );
      case "epic":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark" ? "#A759D8" : "rgba(167, 89, 216, 0.8)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.rarityBorder,
              theme === "light" && styles.rarityBorderLight,
            ]}
          />
        );
      case "legendary":
        return (
          <LinearGradient
            colors={[
              "transparent",
              theme === "dark" ? "#FBA61C" : "rgba(251, 166, 28, 0.8)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.rarityBorder,
              theme === "light" && styles.rarityBorderLight,
            ]}
          />
        );
      default:
        return null;
    }
  };

  // Função para obter o estilo do título com base na raridade
  const getTitleStyle = () => {
    if (!isUnlocked) return {};

    switch (achievement.rarity) {
      case "common":
        return styles.commonTitle;
      case "uncommon":
        return styles.uncommonTitle;
      case "rare":
        return styles.rareTitle;
      case "epic":
        return styles.epicTitle;
      case "legendary":
        return styles.legendaryTitle;
      default:
        return {};
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                theme === "dark" ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)",
            },
          ]}
        />
        <BlurView
          intensity={35}
          style={StyleSheet.absoluteFill}
          tint={theme === "dark" ? "dark" : "dark"}
        />
      </TouchableOpacity>

      <View style={styles.modalContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 250 }}
          style={[
            styles.modalContent,
            {
              backgroundColor:
                theme === "dark"
                  ? "rgba(25, 25, 30, 0.9)"
                  : "rgba(255, 255, 255, 0.95)",
              borderColor: isUnlocked
                ? achievement.badgeColor
                : theme === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
              borderWidth: isUnlocked ? 2 : 1,
              shadowColor: isUnlocked ? achievement.badgeColor : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme === "dark" ? 0.4 : 0.2,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {/* Gradiente de fundo específico da raridade */}
          {getRarityGradient()}

          {/* Efeito de brilho na borda para raridades épicas e legendárias */}
          {isUnlocked && ["epic", "legendary"].includes(achievement.rarity) && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.glowingBorder,
                { borderColor: achievement.badgeColor },
                animatedBorderStyle,
              ]}
              pointerEvents="none"
            />
          )}

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.closeModalButton,
                {
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.1)",
                },
              ]}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={theme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.badgeCenterContainer}>
              <View style={styles.badgeWithEffectsContainer}>
                {isUnlocked && (
                  <RarityEffects
                    rarity={achievement.rarity}
                    size={90}
                    isUnlocked={isUnlocked}
                  />
                )}
                <AchievementBadge
                  icon={(isUnlocked ? achievement.icon : "help-circle") as any}
                  color={isUnlocked ? achievement.badgeColor : "#999999"}
                  size="large"
                  locked={!isUnlocked}
                  new={false}
                  showShadow={true}
                  withPulse={isUnlocked && achievement.rarity === "legendary"}
                />
              </View>
            </View>

            <Text
              style={[
                styles.detailTitle,
                { color: colors.text },
                getTitleStyle(),
              ]}
            >
              {isSecret ? "???" : achievement.name}
            </Text>

            <Text
              style={[styles.detailDescription, { color: colors.text + "CC" }]}
            >
              {isSecret ? t("achievements.secret") : achievement.description}
            </Text>

            {!isSecret && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                    isUnlocked && {
                      backgroundColor: `${achievement.badgeColor}${
                        theme === "dark" ? "20" : "30"
                      }`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isUnlocked
                          ? achievement.badgeColor
                          : colors.text + "80",
                      },
                    ]}
                  >
                    {isUnlocked
                      ? t("achievements.unlocked")
                      : t("achievements.locked")}
                  </Text>
                </View>
              </View>
            )}

            {/* Borda decorativa baseada na raridade */}
            {getRarityBorderElement()}

            {!isSecret && (
              <View style={styles.rewardContainer}>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isUnlocked
                        ? `${achievement.badgeColor}${
                            theme === "dark" ? "50" : "40"
                          }`
                        : "#EEEEEE30",
                    },
                  ]}
                />

                <Text style={[styles.rewardTitle, { color: colors.text }]}>
                  {t("achievements.reward")}
                </Text>
                <View
                  style={[
                    styles.fitPointsContainer,
                    isUnlocked &&
                      achievement.rarity === "legendary" &&
                      styles.legendaryRewardContainer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={achievement.fitPointsIcon}
                    size={24}
                    color={achievement.badgeColor}
                  />
                  <Text
                    style={[
                      styles.fitPointsText,
                      { color: colors.text },
                      isUnlocked &&
                        achievement.rarity === "legendary" && {
                          color: achievement.badgeColor,
                          fontWeight: "bold",
                        },
                    ]}
                  >
                    {achievement.fitPoints} {t("achievements.fitPoints")}
                  </Text>
                </View>
              </View>
            )}

            {!isSecret && (
              <View style={styles.rarityInfoContainer}>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isUnlocked
                        ? `${achievement.badgeColor}${
                            theme === "dark" ? "50" : "40"
                          }`
                        : "#EEEEEE30",
                    },
                  ]}
                />

                <Text style={[styles.rarityTitle, { color: colors.text }]}>
                  {t("achievements.rarity")}
                </Text>
                <View
                  style={[
                    styles.rarityBadge,
                    {
                      backgroundColor:
                        theme === "dark"
                          ? `${achievement.badgeColor}20`
                          : `${achievement.badgeColor}35`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rarityText,
                      { color: achievement.badgeColor },
                      achievement.rarity === "legendary" &&
                        styles.legendaryRarityText,
                    ]}
                  >
                    {t(`achievements.rarities.${achievement.rarity}`)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: isUnlocked
                  ? achievement.badgeColor
                  : theme === "dark"
                  ? "rgba(30, 30, 35, 0.95)"
                  : "rgba(245, 245, 245, 0.95)",
                borderWidth: isUnlocked ? (theme === "dark" ? 1 : 0) : 2,
                borderColor: isUnlocked
                  ? theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "transparent"
                  : achievement.badgeColor,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleClose();
            }}
            activeOpacity={0.5}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Text
              style={[
                styles.closeButtonText,
                {
                  color: isUnlocked
                    ? theme === "dark"
                      ? "#000000"
                      : "#FFFFFF"
                    : achievement.badgeColor,
                },
              ]}
            >
              {t("common.close", "Fechar")}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 500,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalHeader: {
    alignItems: "flex-end",
    paddingTop: 20,
    paddingRight: 20,
  },
  closeModalButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  badgeCenterContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  badgeWithEffectsContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    width: 120,
  },
  rarityGradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  rarityBorder: {
    height: 1,
    marginVertical: 10,
    opacity: 0.7,
  },
  rarityBorderLight: {
    height: 2,
    opacity: 0.9,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 26,
  },
  statusContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  rewardContainer: {
    marginTop: 24,
    paddingTop: 0,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  fitPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fitPointsText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 10,
  },
  rarityInfoContainer: {
    marginTop: 24,
    paddingTop: 0,
  },
  rarityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  rarityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  rarityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    margin: 20,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    position: "relative",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Estilos específicos para raridades
  commonTitle: {
    fontWeight: "600",
  },
  uncommonTitle: {
    fontWeight: "700",
    color: "#64B964",
    textShadowColor: "rgba(100, 185, 100, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  rareTitle: {
    fontWeight: "700",
    color: "#5387DF",
    textShadowColor: "rgba(83, 135, 223, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  epicTitle: {
    fontWeight: "700",
    color: "#A759D8",
    textShadowColor: "rgba(167, 89, 216, 0.4)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  legendaryTitle: {
    fontWeight: "800",
    color: "#FBA61C",
    textShadowColor: "rgba(251, 166, 28, 0.3)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  legendaryRewardContainer: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(251, 166, 28, 0.1)",
  },
  legendaryRarityText: {
    textShadowColor: "rgba(251, 166, 28, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0.5,
  },
  glowingBorder: {
    borderWidth: 2,
    borderRadius: 28,
    borderColor: "transparent",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  divider: {
    height: 1,
    marginBottom: 20,
    width: "100%",
  },
});
