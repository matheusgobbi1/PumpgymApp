import React, { useState, useCallback, useMemo, memo } from "react";
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
import AchievementDetailsModal from "./AchievementDetailsModal";
import * as Haptics from "expo-haptics";
import { Achievement } from "../../constants/achievementsDatabase";

const { width } = Dimensions.get("window");

interface AchievementsCardProps {
  onPress: () => void;
}

// Interfaces para tipos de itens de conquista
interface AchievementItem {
  achievement: Achievement | undefined;
  isNew?: boolean;
  locked?: boolean;
}

const StatCard = memo(
  ({ icon, iconColor, label, value, delay, bgColor }: any) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: bgColor,
          borderColor: bgColor,
        },
      ]}
    >
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: iconColor + "15" },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={[styles.statLabel, { color: "#FFFFFF70" }]}>{label}</Text>
        <Text style={[styles.statValue, { color: "#FFFFFF" }]}>{value}</Text>
      </View>
    </View>
  )
);

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
    markUnlockedAsViewed,
  } = useAchievements();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  // Buscar conquistas recentes não visualizadas
  const newAchievements = useMemo(() => {
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
  const featuredAchievements = useMemo(() => {
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
          threshold: 0,
          fitPoints: 0,
          fitPointsIcon: "help-circle",
          trackedValue: "",
          hidden: false,
        } as Achievement,
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
  const toggleExpand = useCallback(() => {
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Função para abrir informações
  const openInfo = useCallback(() => {
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    onPress();
  }, [onPress]);

  // Função para abrir o modal com a conquista selecionada
  const handleAchievementPress = useCallback(
    (achievement: Achievement | undefined) => {
      if (achievement) {
        setSelectedAchievement(achievement);
        setIsModalVisible(true);

        requestAnimationFrame(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          // Marcar como vista se for nova
          if (
            isRecentlyUnlocked(achievement.id) &&
            !recentlyUnlocked.find((a) => a.id === achievement.id)?.viewed
          ) {
            markUnlockedAsViewed(achievement.id);
          }
        });
      }
    },
    [isRecentlyUnlocked, markUnlockedAsViewed, recentlyUnlocked]
  );

  // Função para fechar o modal
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const hasAchievements = stats.unlockedAchievements > 0;

  // Memorizando as estatísticas para evitar re-renderizações
  const statsCards = useMemo(() => {
    if (!isExpanded) return null;

    return (
      <View style={styles.statsGrid}>
        {/* Linha 1 */}
        <View style={styles.statsRow}>
          {/* FitPoints */}
          <StatCard
            icon="flare"
            iconColor={stats.currentFitLevel.color}
            label={t("achievements.fitPoints")}
            value={stats.totalFitPoints}
            delay={0}
            bgColor={colors.card}
          />

          {/* Conquistas */}
          <StatCard
            icon="trophy-outline"
            iconColor="#FFD700"
            label={t("achievements.title")}
            value={`${stats.unlockedAchievements}/${stats.totalAchievements}`}
            delay={1}
            bgColor={colors.card}
          />
        </View>

        {/* Linha 2 */}
        <View style={styles.statsRow}>
          {/* Progresso */}
          <StatCard
            icon="percent"
            iconColor="#4169E1"
            label={t("achievements.stats.completion")}
            value={`${stats.completionPercentage}%`}
            delay={2}
            bgColor={colors.card}
          />

          {/* Sequência */}
          <StatCard
            icon="fire"
            iconColor="#FF6B6B"
            label={t("achievements.stats.streak", "Sequência")}
            value={`${stats.currentStreak || 0} ${
              stats.currentStreak === 1 ? "dia" : "dias"
            }`}
            delay={3}
            bgColor={colors.card}
          />
        </View>
      </View>
    );
  }, [isExpanded, stats, t, colors.card]);

  return (
    <>
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
                  { backgroundColor: colors.accentGray + "20" },
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
                  {t("achievements.level")} {stats.currentFitLevel.level}:{" "}
                  {t(
                    `achievements.fitLevel.levels.${stats.currentFitLevel.level}.title`
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[
                  styles.infoButton,
                  { backgroundColor: colors.accentGray + "20" },
                ]}
                onPress={openInfo}
              >
                <MaterialCommunityIcons
                  name="torch"
                  size={20}
                  color={colors.accentGray}
                />
              </TouchableOpacity>

              {hasAchievements && (
                <TouchableOpacity
                  style={[
                    styles.expandButton,
                    { backgroundColor: colors.accentGray + "20" },
                  ]}
                  onPress={toggleExpand}
                >
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.accentGray}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Barra de progresso sempre visível */}
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
                {stats.fitLevelProgress}% • {stats.fitPointsToNextLevel}{" "}
                FitPoints {t("achievements.forLevel")}{" "}
                {stats.nextFitLevel.level}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Conteúdo expandido */}
        {isExpanded && <View style={styles.expandedContent}>{statsCards}</View>}
      </View>

      {/* Renderizar o Modal aqui */}
      <AchievementDetailsModal
        visible={isModalVisible}
        achievement={selectedAchievement}
        currentValue={selectedAchievement?.threshold ?? 0}
        isUnlocked={true}
        onClose={handleCloseModal}
      />
    </>
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
    marginBottom: 20,
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
  progressContainer: {},
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
    flexDirection: "column",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  featuredAchievementsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  badgeContainer: {
    alignItems: "center",
    width: (width - 100) / 3,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
});

export default memo(AchievementsCard);
