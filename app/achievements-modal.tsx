import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Modal,
  Alert,
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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  RARITY_COLORS,
} from "../constants/achievementsDatabase";
import { FitLevel, getCurrentFitLevel } from "../constants/fitLevelData";

// Renomear componentes animados
const ReanimatedView = Animated.View;
const ReanimatedText = Animated.Text;
const ReanimatedScrollView = Animated.ScrollView;

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 210; // Altura do cabeçalho gradiente expandido
const HEADER_MIN_HEIGHT = 55; // Altura do cabeçalho gradiente colapsado
const FILTER_HEIGHT = 60; // Altura aproximada da área de filtros
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type RarityFilterType = AchievementRarity | "all";
type Filter = { type: "rarity"; value: string };

export default function AchievementsModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0); // Usar useSharedValue do Reanimated

  const {
    achievements,
    progress,
    isAchievementUnlocked,
    getAchievementValue,
    markUnlockedAsViewed,
    isRecentlyUnlocked,
    stats,
    recentlyUnlocked,
  } = useAchievements();

  const [selectedRarityFilter, setSelectedRarityFilter] =
    useState<RarityFilterType>("all");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Cores para os filtros (incluindo "all" e raridades)
  const filterChipColors = useMemo(
    () => ({
      all: "#6b7280",
      ...RARITY_COLORS,
    }),
    []
  );

  // Memorizar as cores das categorias para evitar recriações
  const categoryColors = useMemo(
    () => ({
      all: "#6b7280",
      workout: "#be123c",
      nutrition: "#15803d",
      water: "#0369a1",
      consistency: "#5b21b6",
      social: "#b45309",
      weight: "#4c1d95",
      account: "#c026d3",
    }),
    []
  );

  // --- Reanimated Scroll Handler ---
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // --- Reanimated Styles ---
  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );
    return {
      height: height,
    };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE * 0.7],
      [0, 0, 1],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [1, 0.85],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -3],
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
      transform: [{ scale: scale }, { translateY: translateY }],
    };
  });

  const heroContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.3, HEADER_SCROLL_DISTANCE * 0.5],
      [1, 0.3, 0],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.5],
      [0, -20],
      Extrapolate.CLAMP
    );
    return {
      opacity: opacity,
      transform: [{ translateY: translateY }],
    };
  });

  // Filtrar as conquistas por raridade (memorizado)
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];

    // Filtrar por raridade
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

  // Agrupar conquistas: por categoria se 'all', ou lista única se raridade específica (memorizado)
  const groupedAchievements = useMemo(() => {
    if (selectedRarityFilter === "all") {
      // Agrupar por categoria se "todos" estiver selecionado
      const groupedByCategory: Record<string, Achievement[]> = {};
      filteredAchievements.forEach((achievement) => {
        if (!groupedByCategory[achievement.category]) {
          groupedByCategory[achievement.category] = [];
        }
        groupedByCategory[achievement.category].push(achievement);
      });
      // Ordenar categorias alfabeticamente (opcional, mas pode ser útil)
      const orderedCategories = Object.keys(groupedByCategory).sort();
      const orderedGroupedByCategory: Record<string, Achievement[]> = {};
      orderedCategories.forEach((category) => {
        orderedGroupedByCategory[category] = groupedByCategory[category];
      });
      return orderedGroupedByCategory;
    } else {
      // Retornar a lista filtrada diretamente se uma raridade específica estiver selecionada
      return { [selectedRarityFilter]: filteredAchievements };
    }
  }, [filteredAchievements, selectedRarityFilter]);

  // Raridades disponíveis para filtro (memorizado)
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

  // Filtros de raridade (memorizado)
  const rarityFilters = useMemo(() => {
    return availableRarities.map(
      (rarity) =>
        ({
          type: "rarity",
          value: rarity,
        } as Filter)
    );
  }, [availableRarities]);

  // Traduzir as raridades (memorizado)
  const getRarityTranslation = useCallback(
    (rarity: RarityFilterType): string => {
      if (rarity === "all") {
        return t("achievements.rarities.all");
      }
      // Assumindo que você terá chaves de tradução como 'achievements.rarities.common', etc.
      return t(`achievements.rarities.${rarity}`);
    },
    [t]
  );

  // Traduzir as categorias (mantido para a view 'all')
  const getCategoryTranslation = useCallback(
    (category: AchievementCategory): string => {
      switch (category) {
        case "workout":
          return t("achievements.categories.workout");
        case "nutrition":
          return t("achievements.categories.nutrition");
        case "water":
          return t("achievements.categories.water");
        case "consistency":
          return t("achievements.categories.consistency");
        case "social":
          return t("achievements.categories.social");
        case "weight":
          return t("achievements.categories.weight");
        case "account":
          return t("achievements.categories.account");
        default:
          return t("achievements.categories.other");
      }
    },
    [t]
  );

  // Ícones das raridades (memorizado)
  const getRarityIcon = useCallback((rarity: RarityFilterType): string => {
    switch (rarity) {
      case "all":
        return "star-circle-outline"; // Ícone para "todos"
      case "common":
        return "star-circle"; // Ícone para comum
      case "uncommon":
        return "star-four-points"; // Ícone para incomum
      case "rare":
        return "diamond-stone"; // Ícone para raro
      case "epic":
        return "shield-star"; // Ícone para épico
      case "legendary":
        return "crown"; // Ícone para lendário
      default:
        return "trophy-variant"; // Ícone padrão
    }
  }, []);

  // Função para lidar com o filtro de raridade (com useCallback)
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

  // Função para lidar com fechamento do modal (com useCallback)
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Array para armazenar conquistas que devem ser marcadas como visualizadas
  const newUnlockedAchievements = useRef<string[]>([]);

  // Função para abrir o modal de detalhes (com useCallback)
  const handleOpenDetails = useCallback(
    (achievement: Achievement) => {
      setSelectedAchievement(achievement);
      setDetailsModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Se a conquista foi desbloqueada e é nova, marcar como visualizada
      if (
        isAchievementUnlocked(achievement.id) &&
        isRecentlyUnlocked(achievement.id)
      ) {
        // Usando timeout para garantir que o modal seja mostrado antes de atualizar o estado
        // e com isso garantir uma transição suave
        setTimeout(() => {
          markUnlockedAsViewed(achievement.id);
        }, 300);
      }
    },
    [isAchievementUnlocked, isRecentlyUnlocked, markUnlockedAsViewed]
  );

  // Função para fechar o modal de detalhes (com useCallback)
  const handleCloseDetails = useCallback(() => {
    setDetailsModalVisible(false);
    setTimeout(() => setSelectedAchievement(null), 300);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Renderizar um item de conquista (memorizado)
  const renderAchievementItem = useCallback(
    ({ item }: { item: Achievement }) => {
      const currentValue = getAchievementValue(item.id);
      const isUnlocked = isAchievementUnlocked(item.id);

      // Simplificar a lógica para verificar se uma conquista é nova
      // Uma conquista é nova se estiver desbloqueada e for recentemente desbloqueada
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

  // Modal de detalhes da conquista (memorizado)
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

  // Renderizar grid único de conquistas (Usado quando uma raridade específica é selecionada)
  const rarityAchievementsGrid = useMemo(() => {
    // filteredAchievements já contém apenas as conquistas da raridade selecionada
    return (
      <View style={styles.achievementsGrid}>
        {filteredAchievements.map((achievement) => (
          <React.Fragment key={achievement.id}>
            {renderAchievementItem({ item: achievement })}
          </React.Fragment>
        ))}
      </View>
    );
  }, [filteredAchievements, renderAchievementItem]);

  // Renderizar um chip de filtro de raridade (memorizado)
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

  // Memorizar os gradientes para o header com base na raridade
  const headerGradientColors = useMemo(() => {
    const rarity = selectedRarityFilter;
    const baseColor = stats.currentFitLevel.color;

    if (rarity === "all") {
      // Gradiente do FitLevel com mais contraste e opacidade
      return [
        baseColor, // Cor base (100% opaca)
        baseColor + "E6", // Cor base com ~90% alpha (mais opaca)
        baseColor + "99", // Cor base com ~60% alpha (opacidade média)
      ] as const;
    }

    // Gradientes específicos por raridade com mais contraste
    switch (rarity) {
      case "common":
        return ["#e5e7eb", "#9ca3af", "#4b5563"] as const; // Cinza mais claro -> médio -> escuro
      case "uncommon":
        return ["#6ee7b7", "#10b981", "#047857"] as const; // Verde mais claro -> médio -> escuro
      case "rare":
        return ["#93c5fd", "#3b82f6", "#1d4ed8"] as const; // Azul mais claro -> médio -> escuro
      case "epic":
        return ["#d8b4fe", "#a855f7", "#7e22ce"] as const; // Roxo mais claro -> médio -> escuro
      case "legendary":
        // Efeito de barra de ouro luxuoso com gradientes metálicos
        return [
          "#FFF5D4", // Dourado muito claro (quase branco) para reflexo de luz
          "#FADA80", // Dourado claro
          "#F6C644", // Dourado médio
          "#EAA827", // Dourado intenso
          "#D9952C", // Dourado amarronzado
          "#B17B1E", // Dourado escuro (base)
        ] as const;
      default:
        // Fallback com mais contraste
        const fallbackColor = filterChipColors[rarity] || filterChipColors.all;
        return [
          fallbackColor,
          fallbackColor + "B3",
          fallbackColor + "66",
        ] as const;
    }
  }, [selectedRarityFilter, stats.currentFitLevel.color, filterChipColors]);

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
          {/* Cabeçalho com gradiente colapsável - usar Reanimated.View e headerStyle */}
          <ReanimatedView
            style={[styles.gradientHeaderContainer, headerStyle]} // Aplicar estilo animado
          >
            <LinearGradient
              colors={headerGradientColors}
              style={[styles.headerGradient, { flex: 1 }]}
              {...(selectedRarityFilter === "legendary"
                ? {
                    start: { x: 0, y: 0.4 },
                    end: { x: 1, y: 0.6 },
                    locations: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }
                : {})}
            >
              {/* Efeito de brilho dourado - apenas para raridade lendária */}
              {/* Temporariamente comentado para teste de performance
              {selectedRarityFilter === "legendary" && (
                <MotiView
                  from={{
                    opacity: 0,
                    translateX: -100,
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    translateX: [width * -0.2, width * 1.2],
                  }}
                  transition={{
                    type: "timing",
                    duration: 3000,
                    loop: true,
                    repeatReverse: false,
                    delay: 1500,
                  }}
                  style={{
                    position: "absolute",
                    width: 60,
                    height: "100%",
                    backgroundColor: "#FFFDF2",
                    transform: [{ skewX: "-30deg" }],
                    zIndex: 5,
                  }}
                />
              )}
              */}

              {/* Cabeçalho de navegação */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFF" />
                </TouchableOpacity>

                {/* Usar Reanimated.Text e headerTitleStyle */}
                <ReanimatedText
                  style={[
                    styles.headerTitle,
                    headerTitleStyle, // Aplicar estilo animado
                    selectedRarityFilter === "legendary" && {
                      color: "#FFF9E0",
                      textShadowColor: "rgba(218, 165, 32, 0.6)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {t("achievements.title")}
                </ReanimatedText>

                <View style={{ width: 40 }} />
              </View>

              {/* Conteúdo do cabeçalho - usar Reanimated.View e heroContentStyle */}
              <ReanimatedView
                style={[
                  styles.gradientContent,
                  heroContentStyle, // Aplicar estilo animado
                ]}
              >
                <View style={styles.fitLevelContainer}>
                  <MaterialCommunityIcons
                    name={
                      selectedRarityFilter === "legendary"
                        ? "crown"
                        : stats.currentFitLevel.icon
                    }
                    size={selectedRarityFilter === "legendary" ? 45 : 40}
                    color={
                      selectedRarityFilter === "legendary" ? "#FFF9E0" : "#fff"
                    }
                    style={
                      selectedRarityFilter === "legendary"
                        ? {
                            textShadowColor: "rgba(218, 165, 32, 0.8)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 4,
                          }
                        : {}
                    }
                  />
                  <Text
                    style={[
                      styles.headerGradientTitle,
                      selectedRarityFilter === "legendary" && {
                        color: "#FFF9E0",
                        textShadowColor: "rgba(218, 165, 32, 0.8)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 4,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    {t("achievements.title")}
                  </Text>
                  <View style={styles.fitLevelInfoContainer}>
                    <Text style={styles.fitLevelTitle}>
                      {t("achievements.level")} {stats.currentFitLevel.level}:{" "}
                      {t(
                        `achievements.fitLevel.levels.${stats.currentFitLevel.level}.title`
                      )}
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
              </ReanimatedView>
            </LinearGradient>
          </ReanimatedView>

          {/* Área de filtros - agora é parte do cabeçalho fixo */}
          <View
            style={[
              styles.filtersContainer,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            {/* Filtros de raridade */}
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
        </View>

        {/* Lista de conquistas - usar Reanimated.ScrollView */}
        <ReanimatedScrollView // Usar ReanimatedScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_MAX_HEIGHT + FILTER_HEIGHT - 10 },
          ]}
          scrollEventThrottle={16}
          onScroll={scrollHandler} // Usar scrollHandler do Reanimated
        >
          {/* Exibir as conquistas */}
          <View style={styles.contentInnerContainer}>
            {/* Se 'all' estiver selecionado, renderiza todos os itens filtrados em uma única grid */}
            {selectedRarityFilter === "all" && (
              <View style={styles.achievementsGrid}>
                {filteredAchievements.map((achievement) => (
                  <React.Fragment key={achievement.id}>
                    {renderAchievementItem({ item: achievement })}
                  </React.Fragment>
                ))}
              </View>
            )}
            {/* Se uma raridade específica for selecionada, usa a grid pré-calculada */}
            {selectedRarityFilter !== "all" && rarityAchievementsGrid}
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
        </ReanimatedScrollView>

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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
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
    paddingTop: HEADER_MAX_HEIGHT + FILTER_HEIGHT - 30,
  },
  contentInnerContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
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
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
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
  },
});
