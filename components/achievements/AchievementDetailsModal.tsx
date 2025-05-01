import React, { memo, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
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

function AchievementDetailsModal({
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

  // Hooks para manipulação de dados
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (
      visible &&
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
  }, [visible, isUnlocked, achievement?.rarity, borderOpacity]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      opacity: borderOpacity.value,
    };
  });

  // Função para obter o gradiente com base na raridade (memoizado)
  const rarityGradientElement = useMemo(() => {
    if (!achievement || !isUnlocked) return null;

    // Simplificando gradientes para melhorar o desempenho
    switch (achievement.rarity) {
      case "common":
        return (
          <View
            style={[
              styles.rarityGradientBackground,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(200, 200, 200, 0.08)"
                    : "rgba(210, 210, 210, 0.5)",
              },
            ]}
          />
        );
      case "uncommon":
        return (
          <View
            style={[
              styles.rarityGradientBackground,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(100, 185, 100, 0.12)"
                    : "rgba(100, 185, 100, 0.35)",
              },
            ]}
          />
        );
      case "rare":
        return (
          <View
            style={[
              styles.rarityGradientBackground,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(83, 135, 223, 0.18)"
                    : "rgba(83, 135, 223, 0.4)",
              },
            ]}
          />
        );
      case "epic":
        return (
          <View
            style={[
              styles.rarityGradientBackground,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(167, 89, 216, 0.25)"
                    : "rgba(167, 89, 216, 0.45)",
              },
            ]}
          />
        );
      case "legendary":
        return (
          <LinearGradient
            colors={[
              "#FFF5D4",
              "#FADA80",
              "#F6C644",
              "#EAA827",
              "#D9952C",
              "#B17B1E",
            ]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 1, y: 0.6 }}
            locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            style={styles.rarityGradientBackground}
          />
        );
      default:
        return null;
    }
  }, [achievement, isUnlocked, theme]); // Dependências: achievement, isUnlocked, theme

  // Se não tiver conquista selecionada, não renderiza nada
  if (!achievement) return null;

  const isSecret = achievement.hidden && !isUnlocked;

  // Obter o nome e descrição traduzidos da conquista
  const getAchievementName = () => {
    if (isSecret) return "???";
    return t(
      `achievements.database.achievements.${achievement.id}.name`,
      achievement.name
    );
  };

  const getAchievementDescription = () => {
    if (isSecret) return t("achievements.secret");
    return t(
      `achievements.database.achievements.${achievement.id}.description`,
      achievement.description
    );
  };

  // Obter a tradução para a raridade
  const getRarityTranslation = (rarity: string): string => {
    return t(`achievements.rarities.${rarity}`);
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
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "timing", duration: 150 }}
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
          {rarityGradientElement}

          {/* Efeito de brilho adicional apenas para o lendário */}
          {isUnlocked && achievement.rarity === "legendary" && (
            <MotiView
              from={{ opacity: 0, translateX: -100 }}
              animate={{
                opacity: [0, 0.7, 0],
                translateX: [width * -0.2, width * 1.1],
              }}
              transition={{
                type: "timing",
                duration: 2500,
                loop: true,
                repeatReverse: false,
                delay: 1000,
              }}
              style={styles.legendaryShimmer}
            />
          )}

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

          <View style={styles.contentContainer}>
            {/* Nova Seção Superior: Ícone | Raridade e FitPoints */}
            <View style={styles.topSection}>
              {/* Ícone da Conquista */}
              <View style={styles.badgeCenterContainer}>
                <View style={styles.badgeWithEffectsContainer}>
                  {isUnlocked && achievement.rarity === "legendary" && (
                    <RarityEffects
                      rarity={achievement.rarity}
                      size={80}
                      isUnlocked={isUnlocked}
                    />
                  )}
                  <AchievementBadge
                    icon={
                      (isUnlocked ? achievement.icon : "help-circle") as any
                    }
                    color={isUnlocked ? achievement.badgeColor : "#999999"}
                    size="large"
                    locked={!isUnlocked}
                    new={false}
                    showShadow={true}
                    withPulse={false}
                  />
                </View>
              </View>

              {/* Lado Direito: Raridade e FitPoints */}
              {!isSecret && (
                <View style={styles.rightInfoContainer}>
                  {/* Raridade */}
                  <View
                    style={[
                      styles.rarityBadgeContainer,
                      {
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(40, 40, 45, 0.7)"
                            : "rgba(240, 240, 245, 0.7)",
                        borderColor: isUnlocked
                          ? `${achievement.badgeColor}40`
                          : theme === "dark"
                          ? "rgba(70, 70, 75, 0.4)"
                          : "rgba(200, 200, 205, 0.4)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        achievement.rarity === "legendary"
                          ? "crown"
                          : achievement.rarity === "epic"
                          ? "star-four-points"
                          : achievement.rarity === "rare"
                          ? "star"
                          : achievement.rarity === "uncommon"
                          ? "circle-slice-8"
                          : "circle-outline"
                      }
                      size={18}
                      color={achievement.badgeColor}
                      style={styles.rarityIcon}
                    />
                    <Text
                      style={[
                        styles.rarityText,
                        { color: achievement.badgeColor },
                        achievement.rarity === "legendary" &&
                          styles.legendaryRarityText,
                      ]}
                    >
                      {getRarityTranslation(achievement.rarity)}
                    </Text>
                  </View>

                  {/* FitPoints */}
                  <View
                    style={[
                      styles.fitPointsContainerRight,
                      {
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(40, 40, 45, 0.7)"
                            : "rgba(240, 240, 245, 0.7)",
                        borderColor: isUnlocked
                          ? `${achievement.badgeColor}40`
                          : theme === "dark"
                          ? "rgba(70, 70, 75, 0.4)"
                          : "rgba(200, 200, 205, 0.4)",
                      },
                      isUnlocked &&
                        achievement.rarity === "legendary" && {
                          backgroundColor: "rgba(251, 166, 28, 0.1)",
                          borderColor: "rgba(251, 166, 28, 0.3)",
                        },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="flare"
                      size={20}
                      color={achievement.badgeColor}
                      style={styles.fitPointsIconRight}
                    />
                    <Text
                      style={[
                        styles.fitPointsText,
                        { color: colors.text },
                        isUnlocked &&
                          achievement.rarity === "legendary" && {
                            color: "#4A2B00",
                            fontWeight: "bold",
                          },
                      ]}
                    >
                      {achievement.fitPoints}{" "}
                      {t("achievements.fitPointsShort", "FP")}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Título e Descrição abaixo */}
            <View style={styles.textContainerBottom}>
              <Text
                style={[
                  styles.detailTitle,
                  { color: colors.text },
                  isUnlocked && achievement.rarity === "legendary"
                    ? styles.legendaryTitle
                    : isUnlocked
                    ? achievement.rarity === "common"
                      ? [
                          styles.commonTitle,
                          { color: theme === "dark" ? "#E0E0E0" : "#444444" },
                        ]
                      : achievement.rarity === "uncommon"
                      ? [
                          styles.uncommonTitle,
                          {
                            color: theme === "dark" ? "#86DC86" : "#1E8449",
                            textShadowColor:
                              theme === "dark"
                                ? "rgba(100, 185, 100, 0.2)"
                                : "rgba(255, 255, 255, 0.5)",
                          },
                        ]
                      : achievement.rarity === "rare"
                      ? [
                          styles.rareTitle,
                          {
                            color: theme === "dark" ? "#7CACF8" : "#2471A3",
                            textShadowColor:
                              theme === "dark"
                                ? "rgba(83, 135, 223, 0.25)"
                                : "rgba(255, 255, 255, 0.5)",
                          },
                        ]
                      : achievement.rarity === "epic"
                      ? [
                          styles.epicTitle,
                          {
                            color: theme === "dark" ? "#C58AF3" : "#6C3483",
                            textShadowColor:
                              theme === "dark"
                                ? "rgba(167, 89, 216, 0.3)"
                                : "rgba(255, 255, 255, 0.5)",
                          },
                        ]
                      : {}
                    : {},
                ]}
              >
                {getAchievementName()}
              </Text>
              <Text
                style={[
                  styles.detailDescription,
                  {
                    color:
                      isUnlocked && achievement.rarity === "legendary"
                        ? "#4A2B00"
                        : colors.text + "CC",
                  },
                ]}
              >
                {getAchievementDescription()}
              </Text>
            </View>
          </View>

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
                marginTop: 10,
              },
            ]}
            onPress={handleClose}
            activeOpacity={0.5}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Text
              style={[
                styles.closeButtonText,
                {
                  color: isUnlocked
                    ? achievement.rarity === "legendary"
                      ? "#4A2B00"
                      : theme === "dark"
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
  },
  modalHeader: {
    alignItems: "flex-end",
    paddingTop: 16,
    paddingRight: 16,
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  badgeCenterContainer: {
    marginRight: 15,
  },
  badgeWithEffectsContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 95,
    width: 95,
  },
  textContainer: {
    flex: 1,
  },
  rightInfoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 10,
    marginLeft: 10,
  },
  rarityBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  fitPointsContainerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  fitPointsIconRight: {
    marginRight: 4,
  },
  statusSectionTop: {
    marginBottom: 15,
    marginTop: 5,
  },
  statusSection: {
    marginBottom: 15,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 150,
    alignSelf: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: 5,
  },
  statusIcon: {
    marginRight: 6,
  },
  rarityIcon: {
    marginRight: 6,
  },
  rarityGradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 15,
    marginBottom: 5,
    lineHeight: 20,
    opacity: 0.9,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "bold",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  fitPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  fitPointsIconContainer: {
    marginRight: 6,
  },
  fitPointsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  rarityText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  closeButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 48,
    borderRadius: 24,
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
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rareTitle: {
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  epicTitle: {
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  legendaryTitle: {
    fontWeight: "800",
    color: "#4A2B00",
    textShadowColor: "rgba(255, 230, 180, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.5,
  },
  legendaryRewardContainer: {
    backgroundColor: "rgba(251, 166, 28, 0.1)",
    borderColor: "rgba(251, 166, 28, 0.3)",
  },
  legendaryRarityText: {
    color: "#FFF9E0",
    textShadowColor: "rgba(74, 43, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: "bold",
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
  legendaryShimmer: {
    position: "absolute",
    width: 70,
    height: "100%",
    backgroundColor: "rgba(255, 253, 242, 0.8)",
    transform: [{ skewX: "-30deg" }],
    zIndex: 1,
    borderRadius: 28,
  },
  textContainerBottom: {
    marginTop: 10,
    alignItems: "flex-start",
    paddingHorizontal: 5,
  },
});

export default memo(AchievementDetailsModal);
