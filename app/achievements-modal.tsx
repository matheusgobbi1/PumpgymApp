import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  FlatList,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 180;
const HEADER_MIN_HEIGHT = 55;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Definição dos tipos
type AchievementCategory =
  | "iniciante"
  | "treino"
  | "nutrição"
  | "hidratação"
  | "atividade"
  | "consistência"
  | "especial";

const AchievementsModal = () => {
  const { achievements } = useGamefication();
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | "todos"
  >("todos");

  const colors = Colors[theme];

  const categoryColors: Record<AchievementCategory, string> = {
    iniciante: "#4c1d95",
    treino: "#be123c",
    nutrição: "#15803d",
    hidratação: "#0369a1",
    atividade: "#b45309",
    consistência: "#5b21b6",
    especial: "#c026d3",
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

  // Filtrar conquistas com base nos filtros selecionados
  const filteredAchievements = useMemo(() => {
    return achievements.filter((achievement) => {
      // Filtrar por categoria
      if (
        selectedCategory !== "todos" &&
        achievement.category !== selectedCategory
      ) {
        return false;
      }

      return true;
    });
  }, [achievements, selectedCategory]);

  // Agrupar conquistas por categoria
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, typeof achievements> = {};

    filteredAchievements.forEach((achievement) => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category].push(achievement);
    });

    return grouped;
  }, [filteredAchievements]);

  // Ordenar categorias
  const categories = useMemo(() => {
    const categoryOrder: AchievementCategory[] = [
      "iniciante",
      "treino",
      "nutrição",
      "hidratação",
      "atividade",
      "consistência",
      "especial",
    ];

    return categoryOrder.filter(
      (category) => achievementsByCategory[category]?.length > 0
    );
  }, [achievementsByCategory]);

  const getCategoryName = (category: string): string => {
    switch (category) {
      case "iniciante":
        return "Iniciante";
      case "treino":
        return "Treinos";
      case "nutrição":
        return "Nutrição";
      case "hidratação":
        return "Hidratação";
      case "atividade":
        return "Atividade";
      case "consistência":
        return "Consistência";
      case "especial":
        return "Especial";
      case "todos":
        return "Todos";
      default:
        return category;
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCategoryFilter = (category: AchievementCategory | "todos") => {
    if (category === selectedCategory) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mudança imediata para melhor experiência do usuário
    setSelectedCategory(category);
  };

  // Renderizar uma seção de categoria
  const renderCategory = (category: string) => {
    const categoryAchievements = achievementsByCategory[category] || [];
    const unlockedCount = categoryAchievements.filter((a) => a.unlocked).length;

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
            {getCategoryName(category)}
          </Text>
          <Text style={[styles.categoryCount, { color: colors.text + "70" }]}>
            {unlockedCount}/{categoryAchievements.length}
          </Text>
        </View>

        {categoryAchievements.map((achievement, index) => (
          <React.Fragment key={achievement.id}>
            <AchievementCard achievement={achievement} index={index} />
          </React.Fragment>
        ))}
      </MotiView>
    );
  };

  // Renderizar um chip de filtro
  const renderCategoryChip = (category: AchievementCategory | "todos") => {
    const isSelected = selectedCategory === category;
    const chipColor =
      category === "todos"
        ? "#6b7280"
        : categoryColors[category as AchievementCategory];

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
        <Text
          style={[
            styles.filterChipText,
            { color: isSelected ? chipColor : colors.text + "70" },
            isSelected && { fontWeight: "700" },
          ]}
        >
          {getCategoryName(category)}
        </Text>
      </TouchableOpacity>
    );
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const allCategories: (AchievementCategory | "todos")[] = useMemo(() => {
    return [
      "todos",
      "iniciante",
      "treino",
      "nutrição",
      "hidratação",
      "atividade",
      "consistência",
      "especial",
    ];
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        {/* Cabeçalho com gradiente colapsável */}
        <Animated.View
          style={[styles.gradientHeaderContainer, { height: headerHeight }]}
        >
          <LinearGradient
            colors={[
              categoryColors.iniciante,
              categoryColors.iniciante + "90",
              categoryColors.iniciante + "40",
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
                {t("gamefication.achievements")} ({unlockedCount}/{totalCount})
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
              <MaterialCommunityIcons
                name="trophy-outline"
                size={32}
                color="#fff"
                style={styles.trophyIcon}
              />
              <Text style={styles.headerGradientTitle}>
                {t("gamefication.achievements")}
              </Text>
              <Text style={styles.headerGradientSubtitle}>
                {unlockedCount}/{totalCount}{" "}
                {t("gamefication.achievements_title.title").toLowerCase()}
              </Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Área de filtros */}
        <View
          style={[
            styles.filtersContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Filtros de categoria */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allCategories}
            extraData={selectedCategory}
            initialNumToRender={allCategories.length}
            maxToRenderPerBatch={allCategories.length}
            windowSize={5}
            renderItem={({
              item,
              index,
            }: {
              item: AchievementCategory | "todos";
              index: number;
            }) => {
              return (
                <MotiView
                  key={item}
                  from={{ opacity: 0, translateY: 5 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: index * 30,
                    type: "timing",
                    duration: 200,
                  }}
                >
                  {renderCategoryChip(item)}
                </MotiView>
              );
            }}
            keyExtractor={(item: AchievementCategory | "todos") => item}
            style={styles.filterList}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Exibir as conquistas por categoria */}
          <View style={styles.categoriesContainer}>
            {selectedCategory === "todos"
              ? // Mostrar todas as categorias quando "todos" está selecionado
                categories.map((category) => renderCategory(category))
              : // Mostrar apenas a categoria selecionada
                renderCategory(selectedCategory)}
          </View>

          {/* Estaria vazio? */}
          {filteredAchievements.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="trophy-outline"
                size={80}
                color={colors.text + "40"}
              />
              <Text style={[styles.emptyText, { color: colors.text + "80" }]}>
                {selectedCategory !== "todos"
                  ? "Nenhuma conquista encontrada nessa categoria"
                  : t("gamefication.no_achievements")}
              </Text>
            </View>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    paddingBottom: 25,
  },
  trophyIcon: {
    marginBottom: 12,
  },
  headerGradientTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerGradientSubtitle: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },
  filtersContainer: {
    paddingTop: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterList: {
    flexGrow: 0,
    paddingBottom: 5,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 15,
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
});

export default AchievementsModal;
