import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  FlatList,
  Modal,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useAchievements } from "../context/AchievementContext";
import { useTranslation } from "react-i18next";
import Colors from "../constants/Colors";
import AchievementCard from "../components/achievements/AchievementCard";
import AchievementBadge from "../components/achievements/AchievementBadge";
import AchievementDetailsModal from "../components/achievements/AchievementDetailsModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  RARITY_COLORS,
} from "../constants/achievementsDatabase";
import { FitLevel, getCurrentFitLevel } from "../constants/fitLevelData";

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 210; // Altura do cabeçalho gradiente expandido
const HEADER_MIN_HEIGHT = 55; // Altura do cabeçalho gradiente colapsado
const FILTER_HEIGHT = 60; // Altura aproximada da área de filtros
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type CategoryFilter = AchievementCategory | "all";
type RarityFilter = AchievementRarity | "all";
type Filter = { type: "category" | "rarity"; value: string };

export default function AchievementsModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    achievements,
    progress,
    isAchievementUnlocked,
    getAchievementValue,
    markUnlockedAsViewed,
    isRecentlyUnlocked,
    stats,
  } = useAchievements();

  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("all");
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>("all");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Definir cores por categoria
  const categoryColors: Record<string, string> = {
    all: "#6b7280",
    workout: "#be123c",
    nutrition: "#15803d",
    water: "#0369a1",
    consistency: "#5b21b6",
    social: "#b45309",
    weight: "#4c1d95",
    account: "#c026d3",
  };

  // Calculando os valores de animação
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE * 0.7],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const heroContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.3, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const heroContentTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -3],
    extrapolate: "clamp",
  });

  // Filtrar as conquistas
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];

    // Filtrar por categoria
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.category === selectedFilter
      );
    }

    // Filtrar por raridade
    if (selectedRarity !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.rarity === selectedRarity
      );
    }

    // Ordenar:
    // 1. Conquistas recentemente desbloqueadas (não vistas)
    // 2. Conquistas desbloqueadas
    // 3. Conquistas não desbloqueadas (exceto as escondidas)
    // 4. Conquistas escondidas
    filtered.sort((a, b) => {
      // Verificar se as conquistas estão desbloqueadas
      const aUnlocked = isAchievementUnlocked(a.id);
      const bUnlocked = isAchievementUnlocked(b.id);

      // Verificar se são recentemente desbloqueadas (não vistas)
      const aIsNewUnlocked = aUnlocked && isRecentlyUnlocked(a.id);
      const bIsNewUnlocked = bUnlocked && isRecentlyUnlocked(b.id);

      // Ordenar por novas conquistas
      if (aIsNewUnlocked && !bIsNewUnlocked) return -1;
      if (!aIsNewUnlocked && bIsNewUnlocked) return 1;

      // Depois, ordenar por conquistas desbloqueadas vs não desbloqueadas
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;

      // Por último, ordenar conquistas escondidas
      if (a.hidden && !b.hidden) return 1;
      if (!a.hidden && b.hidden) return -1;

      // Para conquistas na mesma categoria, ordenar por ID
      return a.id.localeCompare(b.id);
    });

    return filtered;
  }, [
    achievements,
    selectedFilter,
    selectedRarity,
    isAchievementUnlocked,
    isRecentlyUnlocked,
  ]);

  // Agrupar conquistas por categoria
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, Achievement[]> = {};

    if (selectedFilter !== "all") {
      // Se um filtro está selecionado, só mostrar essa categoria
      grouped[selectedFilter] = filteredAchievements;
    } else {
      // Senão, agrupar por categoria
      filteredAchievements.forEach((achievement) => {
        if (!grouped[achievement.category]) {
          grouped[achievement.category] = [];
        }
        grouped[achievement.category].push(achievement);
      });
    }

    return grouped;
  }, [filteredAchievements, selectedFilter]);

  // Categorias disponíveis para filtrar
  const availableCategories: CategoryFilter[] = useMemo(() => {
    return [
      "all",
      ...new Set(achievements.map((a) => a.category)),
    ] as CategoryFilter[];
  }, [achievements]);

  // Raridades disponíveis para filtrar
  const availableRarities: RarityFilter[] = useMemo(() => {
    return [
      "all",
      ...new Set(achievements.map((a) => a.rarity)),
    ] as RarityFilter[];
  }, [achievements]);

  // Combinar filtros de raridade e categoria em uma única lista
  const combinedFilters: Filter[] = useMemo(() => {
    const rarityFilters = availableRarities.map(
      (rarity) =>
        ({
          type: "rarity",
          value: rarity,
        } as Filter)
    );

    // Para as categorias, remover a opção "all" já que ela já existe nas raridades
    const categoryFilters = availableCategories
      .filter((category) => category !== "all")
      .map(
        (category) =>
          ({
            type: "category",
            value: category,
          } as Filter)
      );

    // Raridades primeiro, seguidas pelas categorias
    return [...rarityFilters, ...categoryFilters];
  }, [availableRarities, availableCategories]);

  // Traduzir as categorias
  const getCategoryTranslation = (category: CategoryFilter): string => {
    switch (category) {
      case "all":
        return t("achievements.categories.all");
      case "workout":
        return t("achievements.categories.workout");
      case "nutrition":
        return t("achievements.categories.nutrition");
      case "consistency":
        return t("achievements.categories.consistency");
      case "social":
        return t("achievements.categories.social");
      case "weight":
        return t("achievements.categories.weight");
      case "water":
        return t("achievements.categories.water");
      case "account":
        return t("achievements.categories.account");
      default:
        return category;
    }
  };

  // Traduzir as raridades
  const getRarityTranslation = (rarity: RarityFilter): string => {
    switch (rarity) {
      case "all":
        return t("achievements.rarities.all");
      case "common":
        return t("achievements.rarities.common");
      case "uncommon":
        return t("achievements.rarities.uncommon");
      case "rare":
        return t("achievements.rarities.rare");
      case "epic":
        return t("achievements.rarities.epic");
      case "legendary":
        return t("achievements.rarities.legendary");
      default:
        return rarity;
    }
  };

  // Exibir o ícone para cada categoria
  const getCategoryIcon = (category: CategoryFilter): string => {
    switch (category) {
      case "all":
        return "star-circle";
      case "workout":
        return "weight-lifter";
      case "nutrition":
        return "food-apple";
      case "consistency":
        return "calendar-check";
      case "social":
        return "account-group";
      case "weight":
        return "scale-bathroom";
      case "water":
        return "water";
      case "account":
        return "account";
      default:
        return "trophy";
    }
  };

  // Exibir o ícone para cada raridade
  const getRarityIcon = (rarity: RarityFilter): string => {
    switch (rarity) {
      case "all":
        return "filter-variant";
      case "common":
        return "circle-outline";
      case "uncommon":
        return "circle-slice-2";
      case "rare":
        return "circle-slice-4";
      case "epic":
        return "circle-slice-6";
      case "legendary":
        return "circle-slice-8";
      default:
        return "trophy";
    }
  };

  // Função para lidar com o filtro de categoria
  const handleCategoryFilter = (category: CategoryFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Se estiver selecionando um filtro de categoria, resetar o filtro de raridade
    if (category !== "all" && selectedRarity !== "all") {
      setSelectedRarity("all");
    }

    // Se clicou no mesmo filtro, desmarcar
    if (category === selectedFilter) {
      setSelectedFilter("all");
    } else {
      setSelectedFilter(category);
    }
  };

  // Função para lidar com o filtro de raridade
  const handleRarityFilter = (rarity: RarityFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Se estiver selecionando um filtro de raridade, resetar o filtro de categoria
    if (rarity !== "all" && selectedFilter !== "all") {
      setSelectedFilter("all");
    }

    // Se clicou no mesmo filtro, desmarcar
    if (rarity === selectedRarity) {
      setSelectedRarity("all");
    } else {
      setSelectedRarity(rarity);
    }
  };

  // Função para lidar com fechamento do modal
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Array para armazenar conquistas que devem ser marcadas como visualizadas
  const newUnlockedAchievements = useRef<string[]>([]);

  // Função para abrir o modal de detalhes
  const handleOpenDetails = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDetailsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Se a conquista foi desbloqueada e é nova, marcar como visualizada
    if (
      isAchievementUnlocked(achievement.id) &&
      isRecentlyUnlocked(achievement.id)
    ) {
      if (!newUnlockedAchievements.current.includes(achievement.id)) {
        newUnlockedAchievements.current.push(achievement.id);
        markUnlockedAsViewed(achievement.id);
      }
    }
  };

  // Função para fechar o modal de detalhes
  const handleCloseDetails = () => {
    setDetailsModalVisible(false);
    setTimeout(() => setSelectedAchievement(null), 300);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Renderizar um item de conquista usando o componente AchievementCard
  const renderAchievementItem = ({ item }: { item: Achievement }) => {
    const currentValue = getAchievementValue(item.id);
    const isUnlocked = isAchievementUnlocked(item.id);
    const isNew = isUnlocked && isRecentlyUnlocked(item.id);

    // Marcar conquistas não visualizadas
    if (isNew) {
      const alreadyAdded = newUnlockedAchievements.current.includes(item.id);
      if (!alreadyAdded) {
        newUnlockedAchievements.current.push(item.id);
      }
    }

    return (
      <AchievementCard
        achievement={item}
        currentValue={currentValue}
        isUnlocked={isUnlocked}
        isNew={isNew}
        onPress={handleOpenDetails}
      />
    );
  };

  // Modal de detalhes da conquista
  const renderAchievementDetailsModal = () => {
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
  };

  // Renderizar categoria com grid
  const renderCategory = (category: string) => {
    const categoryAchievements = achievementsByCategory[category] || [];
    const unlockedCount = categoryAchievements.filter((a) =>
      isAchievementUnlocked(a.id)
    ).length;

    return (
      <MotiView
        key={category}
        from={{ opacity: 0, translateY: 5 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.categorySection}
      >
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            {getCategoryTranslation(category as CategoryFilter)}
          </Text>
          <Text style={[styles.categoryCount, { color: colors.text + "70" }]}>
            {unlockedCount}/{categoryAchievements.length}
          </Text>
        </View>

        <View style={styles.achievementsGrid}>
          {categoryAchievements.map((achievement) => (
            <React.Fragment key={achievement.id}>
              {renderAchievementItem({ item: achievement })}
            </React.Fragment>
          ))}
        </View>
      </MotiView>
    );
  };

  // Renderizar grid de todas as conquistas quando selectedFilter === "all"
  const renderAllAchievementsGrid = () => {
    return (
      <View style={styles.achievementsGrid}>
        {filteredAchievements.map((achievement) => (
          <React.Fragment key={achievement.id}>
            {renderAchievementItem({ item: achievement })}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Renderizar um chip de filtro (categoria ou raridade)
  const renderFilterChip = (filter: Filter) => {
    const { type, value } = filter;

    if (type === "category") {
      const category = value as CategoryFilter;
      const isSelected = selectedFilter === category;
      const chipColor = categoryColors[category] || categoryColors.all;

      return (
        <TouchableOpacity
          onPress={() => handleCategoryFilter(category)}
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
            name={getCategoryIcon(category) as any}
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
            {getCategoryTranslation(category)}
          </Text>
        </TouchableOpacity>
      );
    } else {
      const rarity = value as RarityFilter;
      const isSelected = selectedRarity === rarity;
      const chipColor =
        rarity === "all" ? categoryColors.all : RARITY_COLORS[rarity];

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
    }
  };

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
        {/* Header fixo que inclui gradiente e filtros */}
        <View style={styles.fixedHeaderContainer}>
          {/* Cabeçalho com gradiente colapsável */}
          <Animated.View
            style={[styles.gradientHeaderContainer, { height: headerHeight }]}
          >
            <LinearGradient
              colors={[
                selectedFilter === "all"
                  ? stats.currentFitLevel.color
                  : categoryColors[selectedFilter] || categoryColors.all,
                selectedFilter === "all"
                  ? stats.currentFitLevel.color + "90"
                  : categoryColors[selectedFilter] + "90" ||
                    categoryColors.all + "90",
                selectedFilter === "all"
                  ? stats.currentFitLevel.color + "40"
                  : categoryColors[selectedFilter] + "40" ||
                    categoryColors.all + "40",
              ]}
              style={[styles.headerGradient, { flex: 1 }]}
            >
              {/* Cabeçalho de navegação */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFF" />
                </TouchableOpacity>

                <Animated.Text
                  style={[
                    styles.headerTitle,
                    {
                      opacity: headerTitleOpacity,
                      transform: [
                        { scale: titleScale },
                        { translateY: titleTranslateY },
                      ],
                    },
                  ]}
                >
                  {t("achievements.title")}
                </Animated.Text>

                <View style={{ width: 40 }} />
              </View>

              {/* Conteúdo do cabeçalho - desaparece ao rolar */}
              <Animated.View
                style={[
                  styles.gradientContent,
                  {
                    opacity: heroContentOpacity,
                    transform: [{ translateY: heroContentTranslate }],
                  },
                ]}
              >
                <View style={styles.fitLevelContainer}>
                  <MaterialCommunityIcons
                    name={stats.currentFitLevel.icon}
                    size={40}
                    color="#fff"
                  />
                  <Text style={styles.headerGradientTitle}>
                    {t("achievements.title")}
                  </Text>
                  <View style={styles.fitLevelInfoContainer}>
                    <Text style={styles.fitLevelTitle}>
                      Nível {stats.currentFitLevel.level}:{" "}
                      {stats.currentFitLevel.title}
                    </Text>
                    {stats.nextFitLevel && (
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${stats.fitLevelProgress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {stats.fitLevelProgress}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Área de filtros - agora é parte do cabeçalho fixo */}
          <Animated.View
            style={[
              styles.filtersContainer,
              {
                backgroundColor: colors.background,
                borderBottomWidth: 0,
                shadowColor: "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [0, HEADER_SCROLL_DISTANCE],
                      outputRange: [0, 0],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Filtros combinados (raridade + categoria) */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={combinedFilters}
              extraData={[selectedFilter, selectedRarity]}
              initialNumToRender={combinedFilters.length}
              renderItem={({
                item,
                index,
              }: {
                item: Filter;
                index: number;
              }) => (
                <MotiView
                  key={`${item.type}-${item.value}`}
                  from={{ opacity: 0, translateY: 5 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    delay: index * 30,
                    type: "timing",
                    duration: 200,
                  }}
                >
                  {renderFilterChip(item)}
                </MotiView>
              )}
              keyExtractor={(item) => `${item.type}-${item.value}`}
              style={styles.filterList}
              contentContainerStyle={styles.filtersContent}
            />
          </Animated.View>
        </View>

        {/* Lista de conquistas - com padding para evitar sobreposição com o cabeçalho */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_MAX_HEIGHT + FILTER_HEIGHT - 10 }, // Reduzindo o paddingTop
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Exibir as conquistas */}
          <View style={styles.categoriesContainer}>
            {selectedFilter === "all"
              ? renderAllAchievementsGrid()
              : renderCategory(selectedFilter)}
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
        </Animated.ScrollView>

        {/* Modal de detalhes da conquista */}
        {renderAchievementDetailsModal()}
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
  fixedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
    color: "#FFF",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientHeaderContainer: {
    overflow: "hidden",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  headerGradient: {
    paddingHorizontal: 20,
  },
  gradientContent: {
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 15,
  },
  trophyIcon: {
    marginBottom: 8,
  },
  headerGradientTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },
  headerGradientSubtitle: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },
  // Estilos para as estatísticas no cabeçalho
  headerStatsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  headerStatItem: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerStatDivider: {
    height: 24,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
    paddingTop: HEADER_MAX_HEIGHT + FILTER_HEIGHT - 30, // Reduzindo o paddingTop
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginTop: 8, // Reduzindo a margem superior
  },

  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryCount: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
  achievementsList: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  fitLevelContainer: {
    alignItems: "center",
    width: "100%",
  },
  fitLevelInfoContainer: {
    alignItems: "center",
    marginTop: 8,
    width: "80%",
  },
  fitLevelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginRight: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 3,
  },
  progressText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    width: 40,
    textAlign: "right",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginHorizontal: -5,
  },
});
