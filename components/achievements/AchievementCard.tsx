import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import AchievementBadge from "./AchievementBadge";
import { Achievement } from "../../constants/achievementsDatabase";
import { LinearGradient } from "expo-linear-gradient";
import RarityEffects from "./RarityEffects";

const { width } = Dimensions.get("window");
const BADGE_SIZE = (width - 80) / 4; // 4 badges por linha com margens

interface AchievementCardProps {
  achievement: Achievement;
  currentValue: number;
  isUnlocked: boolean;
  isNew: boolean;
  onPress: (achievement: Achievement) => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  currentValue,
  isUnlocked,
  isNew,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Se a conquista é secreta e não está desbloqueada, mostrar uma versão oculta
  const isSecret = achievement.hidden && !isUnlocked;

  // Definição de estilos por raridade
  const getRarityStyles = () => {
    if (!isUnlocked) return {};

    switch (achievement.rarity) {
      case "common":
        return {
          badgeWrapper: styles.commonBadgeWrapper,
          titleStyle: styles.commonTitle,
        };
      case "uncommon":
        return {
          badgeWrapper: styles.uncommonBadgeWrapper,
          titleStyle: styles.uncommonTitle,
        };
      case "rare":
        return {
          badgeWrapper: styles.rareBadgeWrapper,
          titleStyle: styles.rareTitle,
        };
      case "epic":
        return {
          badgeWrapper: styles.epicBadgeWrapper,
          titleStyle: styles.epicTitle,
        };
      case "legendary":
        return {
          badgeWrapper: styles.legendaryBadgeWrapper,
          titleStyle: styles.legendaryTitle,
          containerStyle: styles.legendaryContainer,
        };
      default:
        return {};
    }
  };

  const rarityStyles = getRarityStyles();

  return (
    <TouchableOpacity
      style={[styles.badgeContainer, rarityStyles.containerStyle]}
      onPress={() => onPress(achievement)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badgeWrapper,
          isNew && styles.newAchievementBadge,
          rarityStyles.badgeWrapper,
        ]}
      >
        {/* Efeitos visuais baseados na raridade */}
        <RarityEffects
          rarity={achievement.rarity}
          size={BADGE_SIZE - 5}
          isUnlocked={isUnlocked}
        />

        <AchievementBadge
          icon={(isUnlocked ? achievement.icon : "help-circle") as any}
          color={isUnlocked ? achievement.badgeColor : "#999999"}
          size="medium"
          locked={!isUnlocked}
          new={isNew}
          showShadow={isUnlocked}
          withPulse={isUnlocked && achievement.rarity === "legendary"}
        />
      </View>

      <Text
        style={[
          styles.badgeTitle,
          { color: colors.text },
          isSecret && styles.secretText,
          isUnlocked && rarityStyles.titleStyle,
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {isSecret ? "???" : achievement.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    width: BADGE_SIZE,
    alignItems: "center",
    margin: 5,
    height: BADGE_SIZE + 30, // Altura fixa para melhor alinhamento
  },
  badgeWrapper: {
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    position: "relative",
    borderRadius: BADGE_SIZE / 2,
  },
  newAchievementBadge: {
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: BADGE_SIZE / 2,
  },
  badgeTitle: {
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
    width: "100%",
    lineHeight: 11,
  },
  secretText: {
    fontStyle: "italic",
  },
  // Estilos baseados em raridade
  commonBadgeWrapper: {
    padding: 2,
  },
  uncommonBadgeWrapper: {
    padding: 2,
    borderWidth: 1,
    borderColor: "#64B964",
    borderRadius: BADGE_SIZE / 2,
  },
  rareBadgeWrapper: {
    padding: 2,
    borderWidth: 2,
    borderColor: "#5387DF",
    borderRadius: BADGE_SIZE / 2,
    borderStyle: "dashed",
    elevation: 2,
  },
  epicBadgeWrapper: {
    padding: 3,
    borderWidth: 2,
    borderColor: "#A759D8",
    borderRadius: BADGE_SIZE / 2,
    borderStyle: "dotted",
    elevation: 3,
  },
  legendaryBadgeWrapper: {
    padding: 4,
    borderWidth: 3,
    borderColor: "#FBA61C",
    borderRadius: BADGE_SIZE / 2,
    borderStyle: "solid",
    elevation: 5,
    shadowColor: "#FBA61C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  legendaryContainer: {
    transform: [{ scale: 1.05 }],
  },

  // Estilos de texto baseados em raridade
  commonTitle: {
    fontWeight: "500",
  },
  uncommonTitle: {
    fontWeight: "600",
    color: "#64B964",
  },
  rareTitle: {
    fontWeight: "700",
    color: "#5387DF",
    textShadowColor: "rgba(83, 135, 223, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: 10,
  },
  epicTitle: {
    fontWeight: "700",
    color: "#A759D8",
    textShadowColor: "rgba(167, 89, 216, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: 10,
  },
  legendaryTitle: {
    fontWeight: "800",
    color: "#FBA61C",
    textShadowColor: "rgba(251, 166, 28, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

export default React.memo(AchievementCard);
