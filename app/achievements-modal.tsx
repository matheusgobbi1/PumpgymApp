import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useAchievements } from "../context/AchievementContext";
import { useTranslation } from "react-i18next";
import Colors from "../constants/Colors";
import AchievementCard from "../components/achievements/AchievementCard";
import AchievementDetailsModal from "../components/achievements/AchievementDetailsModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  RARITY_COLORS,
} from "../constants/achievementsDatabase";

type RarityFilterType = AchievementRarity | "all";
type Filter = { type: "rarity"; value: string };

export default function AchievementsModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();

  const {
    achievements,
    isAchievementUnlocked,
    getAchievementValue,
    markUnlockedAsViewed,
    isRecentlyUnlocked,
    stats,
  } = useAchievements();

  const [selectedRarityFilter, setSelectedRarityFilter] =
    useState<RarityFilterType>("all");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Cores para os filtros
  const filterChipColors = useMemo(
    () => ({
      all: "#6b7280",
      ...RARITY_COLORS,
    }),
    []
  );

  // Filtrar as conquistas por raridade
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];

    if (selectedRarityFilter !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.rarity === selectedRarityFilter
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      const aUnlocked = isAchievementUnlocked(a.id);
      const bUnlocked = isAchievementUnlocked(b.id);
      const aIsNewUnlocked = aUnlocked && isRecentlyUnlocked(a.id);
      const bIsNewUnlocked = bUnlocked && isRecentlyUnlocked(b.id);

      if (aIsNewUnlocked && !bIsNewUnlocked) return -1;
      if (!aIsNewUnlocked && bIsNewUnlocked) return 1;
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      if (a.hidden && !b.hidden) return 1;
      if (!a.hidden && b.hidden) return -1;
      return a.id.localeCompare(b.id);
    });

    return filtered;
  }, [
    achievements,
    selectedRarityFilter,
    isAchievementUnlocked,
    isRecentlyUnlocked,
  ]);

  // Raridades disponíveis para filtro
  const availableRarities = useMemo(() => {
    return [
      "all",
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
    ] as RarityFilterType[];
  }, []);

  // Filtros de raridade
  const rarityFilters = useMemo(() => {
    return availableRarities.map(
      (rarity) =>
        ({
          type: "rarity",
          value: rarity,
        } as Filter)
    );
  }, [availableRarities]);

  // Traduzir as raridades
  const getRarityTranslation = useCallback(
    (rarity: RarityFilterType): string => {
      if (rarity === "all") {
        return t("achievements.rarities.all");
      }
      return t(`achievements.rarities.${rarity}`);
    },
    [t]
  );

  // Traduzir as categorias
  const getCategoryTranslation = useCallback(
    (category: AchievementCategory): string => {
      return t(`achievements.categories.${category}`);
    },
    [t]
  );

  // Ícones das raridades
  const getRarityIcon = useCallback((rarity: RarityFilterType): string => {
    switch (rarity) {
      case "all":
        return "star-circle-outline";
      case "common":
        return "star-circle";
      case "uncommon":
        return "star-four-points";
      case "rare":
        return "diamond-stone";
      case "epic":
        return "shield-star";
      case "legendary":
        return "crown";
      default:
        return "trophy-variant";
    }
  }, []);

  // Função para lidar com o filtro de raridade
  const handleRarityFilter = useCallback(
    (rarity: RarityFilterType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (rarity === selectedRarityFilter) {
        setSelectedRarityFilter("all");
      } else {
        setSelectedRarityFilter(rarity);
      }
    },
    [selectedRarityFilter]
  );

  // Função para lidar com fechamento do modal
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Função para abrir o modal de detalhes
  const handleOpenDetails = useCallback(
    (achievement: Achievement) => {
      setSelectedAchievement(achievement);
      setDetailsModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Marcar como visualizada se foi desbloqueada recentemente
      if (
        isAchievementUnlocked(achievement.id) &&
        isRecentlyUnlocked(achievement.id)
      ) {
        setTimeout(() => {
          markUnlockedAsViewed(achievement.id);
        }, 300);
      }
    },
    [isAchievementUnlocked, isRecentlyUnlocked, markUnlockedAsViewed]
  );

  // Função para fechar o modal de detalhes
  const handleCloseDetails = useCallback(() => {
    setDetailsModalVisible(false);
    setTimeout(() => setSelectedAchievement(null), 300);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Renderizar um item de conquista
  const renderAchievementItem = useCallback(
    ({ item }: { item: Achievement }) => {
      const currentValue = getAchievementValue(item.id);
      const isUnlocked = isAchievementUnlocked(item.id);
      const isNew = isUnlocked && isRecentlyUnlocked(item.id);

      return (
        <AchievementCard
          achievement={item}
          currentValue={currentValue}
          isUnlocked={isUnlocked}
          isNew={isNew}
          onPress={handleOpenDetails}
        />
      );
    },
    [
      getAchievementValue,
      isAchievementUnlocked,
      isRecentlyUnlocked,
      handleOpenDetails,
    ]
  );

  // Modal de detalhes da conquista
  const achievementDetailsModal = useMemo(() => {
    if (!selectedAchievement) return null;

    return (
      <AchievementDetailsModal
        visible={detailsModalVisible}
        achievement={selectedAchievement}
        currentValue={getAchievementValue(selectedAchievement.id)}
        isUnlocked={isAchievementUnlocked(selectedAchievement.id)}
        onClose={handleCloseDetails}
      />
    );
  }, [
    selectedAchievement,
    detailsModalVisible,
    getAchievementValue,
    isAchievementUnlocked,
    handleCloseDetails,
  ]);

  // Renderizar um chip de filtro de raridade
  const renderFilterChip = useCallback(
    (filter: Filter) => {
      const { value } = filter;
      const rarity = value as RarityFilterType;
      const isSelected = selectedRarityFilter === rarity;
      const chipColor = filterChipColors[rarity] || filterChipColors.all;

      return (
        <TouchableOpacity
          onPress={() => handleRarityFilter(rarity)}
          activeOpacity={0.7}
          style={[
            styles.filterChip,
            {
              backgroundColor: isSelected ? chipColor + "20" : colors.card,
              borderColor: isSelected ? chipColor : colors.text + "20",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={getRarityIcon(rarity) as any}
            size={18}
            color={isSelected ? chipColor : colors.text + "70"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterChipText,
              { color: isSelected ? chipColor : colors.text + "70" },
              isSelected && { fontWeight: "700" },
            ]}
          >
            {getRarityTranslation(rarity)}
          </Text>
        </TouchableOpacity>
      );
    },
    [
      filterChipColors,
      colors.card,
      colors.text,
      getRarityIcon,
      getRarityTranslation,
      handleRarityFilter,
      selectedRarityFilter,
    ]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        {/* Header padronizado */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="chevron-down" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("achievements.title")}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Área de filtros abaixo do header */}
        <View
          style={[
            styles.filtersContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={rarityFilters}
            extraData={selectedRarityFilter}
            initialNumToRender={rarityFilters.length}
            renderItem={({ item }: { item: Filter }) => (
              <View key={`${item.type}-${item.value}`}>
                {renderFilterChip(item)}
              </View>
            )}
            keyExtractor={(item) => `${item.type}-${item.value}`}
            style={styles.filterList}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Lista de conquistas */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Exibir as conquistas */}
          <View style={styles.contentInnerContainer}>
            <View style={styles.achievementsGrid}>
              {filteredAchievements.map((achievement) => (
                <React.Fragment key={achievement.id}>
                  {renderAchievementItem({ item: achievement })}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Estaria vazio? */}
          {filteredAchievements.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={80}
                color={colors.text + "40"}
              />
              <Text style={[styles.emptyText, { color: colors.text + "80" }]}>
                {t("achievements.no_achievements")}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Modal de detalhes da conquista */}
        {achievementDetailsModal}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingBottom: 16,
    zIndex: 99,
  },
  filterList: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 18,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    minWidth: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentInnerContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
