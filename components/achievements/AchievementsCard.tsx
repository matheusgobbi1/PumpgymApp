import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAchievements } from "../../context/AchievementContext";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AchievementBadge from "./AchievementBadge";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface AchievementsCardProps {
  onPress: () => void;
}

// Interfaces para tipos de itens de conquista
interface AchievementItem {
  achievement:
    | {
        id: string;
        name: string;
        description: string;
        category: string;
        icon: string;
        badgeColor: string;
        rarity: string;
      }
    | undefined;
  isNew?: boolean;
  locked?: boolean;
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const {
    stats,
    achievements,
    recentlyUnlocked,
    isAchievementUnlocked,
    isRecentlyUnlocked,
  } = useAchievements();
  const [isExpanded, setIsExpanded] = useState(false);

  // Buscar conquistas recentes não visualizadas
  const newAchievements = React.useMemo(() => {
    return recentlyUnlocked
      .filter((item) => !item.viewed)
      .map((item) => {
        const achievement = achievements.find((a) => a.id === item.id);
        return {
          achievement,
          isNew: true,
        };
      })
      .filter((item) => item.achievement);
  }, [recentlyUnlocked, achievements]);

  // Obter as conquistas mais interessantes para mostrar
  const featuredAchievements = React.useMemo(() => {
    // Se houver conquistas novas, mostrar elas primeiro
    if (newAchievements.length > 0) {
      return newAchievements.slice(0, 3);
    }

    // Caso contrário, mostrar uma seleção das conquistas
    // Priorizar categorias diferentes
    const selected: AchievementItem[] = [];
    const categories = new Set();

    // Conquistadas recentemente (mas já visualizadas)
    const recentViewed = recentlyUnlocked
      .filter((item) => item.viewed)
      .slice(0, 5)
      .map((item) => {
        const achievement = achievements.find((a) => a.id === item.id);
        return { achievement };
      })
      .filter((item) => item.achievement);

    // Adicionar conquistas recentes vistas
    for (const item of recentViewed) {
      if (selected.length >= 2) break;
      if (item.achievement && !categories.has(item.achievement.category)) {
        categories.add(item.achievement.category);
        selected.push(item);
      }
    }

    // Se precisamos de mais, adicionar algumas conquistas desbloqueadas
    if (selected.length < 3) {
      const unlockedAchievements = achievements
        .filter(
          (achievement) =>
            isAchievementUnlocked(achievement.id) &&
            !selected.some(
              (s) => s.achievement && s.achievement.id === achievement.id
            )
        )
        .map((achievement) => ({ achievement }));

      for (const item of unlockedAchievements) {
        if (selected.length >= 3) break;
        if (item.achievement && !categories.has(item.achievement.category)) {
          categories.add(item.achievement.category);
          selected.push(item);
        }
      }
    }

    // Se ainda precisamos de mais, adicionar qualquer conquista desbloqueada
    if (selected.length < 3) {
      const remaining = achievements
        .filter(
          (achievement) =>
            isAchievementUnlocked(achievement.id) &&
            !selected.some(
              (s) => s.achievement && s.achievement.id === achievement.id
            )
        )
        .map((achievement) => ({ achievement }));

      for (const item of remaining) {
        if (selected.length >= 3) break;
        selected.push(item);
      }
    }

    // Se ainda estamos abaixo de 3, adicionar bloqueadas
    while (selected.length < 3) {
      selected.push({
        achievement: {
          id: `locked-${selected.length}`,
          name: "???",
          description: t("achievements.locked"),
          category: "account",
          icon: "lock",
          badgeColor: "#999999",
          rarity: "common",
        },
        isNew: false,
        locked: true,
      });
    }

    return selected;
  }, [
    newAchievements,
    recentlyUnlocked,
    achievements,
    isAchievementUnlocked,
    t,
  ]);

  // Função para alternar entre expandido e recolhido
  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Função para abrir informações
  const openInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Aqui você poderia implementar um modal de informações similar ao NutritionProgressChart
    // Por enquanto, apenas usando o onPress padrão
    onPress();
  }, [onPress]);

  // Renderizar um badge para uma conquista
  const renderAchievementBadge = (item: AchievementItem, index: number) => {
    if (!item.achievement) return null;

    // Criar uma chave realmente única
    const uniqueKey = `${item.achievement.id}-${index}`;

    return (
      <Animated.View
        key={uniqueKey}
        entering={FadeInDown.delay(index * 100).duration(300)}
        style={[styles.badgeContainer, { marginLeft: index > 0 ? 12 : 0 }]}
      >
        <AchievementBadge
          icon={item.achievement.icon as any}
          color={item.achievement.badgeColor}
          size="medium"
          locked={!!item.locked}
          new={!!item.isNew}
        />
        {!item.locked && (
          <Text
            style={[
              styles.badgeTitle,
              { color: colors.text, opacity: 0.8 },
              item.isNew && {
                color: item.achievement.badgeColor,
                fontWeight: "bold",
              },
            ]}
            numberOfLines={1}
          >
            {item.achievement.name}
          </Text>
        )}
      </Animated.View>
    );
  };

  const hasAchievements = stats.unlockedAchievements > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.light,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        style={styles.pressableArea}
        onPress={hasAchievements ? toggleExpand : onPress}
        android_ripple={{ color: colors.text + "10", borderless: true }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: stats.currentFitLevel.color + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={stats.currentFitLevel.icon}
                size={18}
                color={stats.currentFitLevel.color}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("achievements.title")}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.text + "80" }]}
                numberOfLines={1}
              >
                Nível {stats.currentFitLevel.level}:{" "}
                {stats.currentFitLevel.title}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={openInfo}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {hasAchievements && (
              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={toggleExpand}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!isExpanded && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.text + "20" },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stats.fitLevelProgress}%`,
                    backgroundColor: stats.currentFitLevel.color,
                  },
                ]}
              />
            </View>
            {stats.nextFitLevel && (
              <Text
                style={[styles.progressText, { color: colors.text + "70" }]}
              >
                {stats.fitLevelProgress}% • {stats.fitPointsToNextLevel} pts
                para nível {stats.nextFitLevel.level}
              </Text>
            )}
          </View>
        )}
      </Pressable>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.statsGrid}>
            {/* FitPoints */}
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons
                  name="star"
                  size={20}
                  color={stats.currentFitLevel.color}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalFitPoints}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                FitPoints
              </Text>
            </View>

            {/* Conquistas */}
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.unlockedAchievements}/{stats.totalAchievements}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                Conquistas
              </Text>
            </View>

            {/* Progresso */}
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons
                  name="percent"
                  size={20}
                  color="#FF9F1C"
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.completionPercentage}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                Concluído
              </Text>
            </View>
          </View>

          {/* Progresso detalhado */}
          {stats.nextFitLevel && (
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgressHeader}>
                <Text
                  style={[styles.levelProgressTitle, { color: colors.text }]}
                >
                  Próximo Nível: {stats.nextFitLevel.title}
                </Text>
                <Text
                  style={[
                    styles.levelProgressPoints,
                    { color: colors.text + "70" },
                  ]}
                >
                  {stats.totalFitPoints}/{stats.nextFitLevel.pointsRequired}
                </Text>
              </View>

              <View
                style={[
                  styles.levelProgressBar,
                  { backgroundColor: colors.text + "20" },
                ]}
              >
                <View
                  style={[
                    styles.levelProgressFill,
                    {
                      width: `${stats.fitLevelProgress}%`,
                      backgroundColor: stats.currentFitLevel.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Exibição de conquistas em destaque */}
          <View style={styles.featuredAchievementsContainer}>
            {featuredAchievements.map((item, index) =>
              renderAchievementBadge(item, index)
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  pressableArea: {
    padding: 16,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  levelIcon: {
    marginRight: 10,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  expandedContent: {
    padding: 16,
    paddingTop: 6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  levelProgressContainer: {
    marginBottom: 20,
  },
  levelProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelProgressTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  levelProgressPoints: {
    fontSize: 12,
  },
  levelProgressBar: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  featuredAchievementsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  badgeContainer: {
    alignItems: "center",
    width: (width - 100) / 3,
    marginHorizontal: 5,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
});

export default React.memo(AchievementsCard);
