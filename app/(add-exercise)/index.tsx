import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext, Exercise } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import {
  ExerciseData,
  searchExercises,
  muscleGroups,
  getExercisesByMuscle,
} from "../../data/exerciseDatabase";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.44;

// Componente para o esqueleto de carregamento de um item de exercício
const ExerciseItemSkeleton = ({ index }: { index: number }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <MotiView
      key={`skeleton-item-${index}-${theme}`}
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 1000,
        loop: true,
        delay: index * 100,
      }}
      style={[styles.exerciseItem, { backgroundColor: colors.light }]}
    >
      <View style={styles.exerciseInfo}>
        <MotiView
          key={`skeleton-name-${index}-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[
            styles.skeletonExerciseName,
            { backgroundColor: colors.text + "20" },
          ]}
        />
        <MotiView
          key={`skeleton-category-${index}-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[
            styles.skeletonExerciseCategory,
            { backgroundColor: colors.text + "20" },
          ]}
        />
      </View>
      <MotiView
        key={`skeleton-button-${index}-${theme}`}
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "timing",
          duration: 1000,
          loop: true,
        }}
        style={[
          styles.skeletonAddButton,
          { backgroundColor: colors.text + "20" },
        ]}
      />
    </MotiView>
  );
};

// Componente para o esqueleto de carregamento dos resultados da pesquisa
const SearchResultsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <>
      {[...Array(5)].map((_, index) => (
        <ExerciseItemSkeleton
          key={`skeleton_${index}_${theme}`}
          index={index}
        />
      ))}
    </>
  );
};

// Componente para o card de exercício
const ExerciseCard = ({
  exercise,
  index,
  workoutColor,
  onPress,
}: {
  exercise: ExerciseData;
  index: number;
  workoutColor: string;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: index * 50 }}
      style={[styles.exerciseCard, { backgroundColor: colors.card }]}
    >
      <TouchableOpacity
        style={styles.exerciseCardContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.exerciseCardIcon,
            { backgroundColor: workoutColor + "20" },
          ]}
        >
          <Ionicons
            name={
              exercise.muscle === "Peito"
                ? "fitness-outline"
                : exercise.muscle === "Costas"
                ? "body-outline"
                : exercise.muscle === "Pernas"
                ? "walk-outline"
                : exercise.muscle === "Ombros"
                ? "barbell-outline"
                : exercise.muscle === "Bíceps" || exercise.muscle === "Tríceps"
                ? "bicycle-outline"
                : exercise.muscle === "Abdômen"
                ? "body-outline"
                : exercise.muscle === "Cardio"
                ? "heart-outline"
                : "barbell-outline"
            }
            size={24}
            color={workoutColor}
          />
        </View>

        <Text
          style={[styles.exerciseName, { color: colors.text }]}
          numberOfLines={2}
        >
          {exercise.name}
        </Text>

        <View style={styles.exerciseDetails}>
          <View style={styles.exerciseDetailItem}>
            <Ionicons
              name="body-outline"
              size={14}
              color={colors.text + "80"}
            />
            <Text
              style={[styles.exerciseDetailText, { color: colors.text + "80" }]}
            >
              {exercise.muscle}
            </Text>
          </View>

          <View style={styles.exerciseDetailItem}>
            <Ionicons
              name="barbell-outline"
              size={14}
              color={colors.text + "80"}
            />
            <Text
              style={[styles.exerciseDetailText, { color: colors.text + "80" }]}
            >
              {exercise.equipment}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.exerciseDifficulty,
            {
              backgroundColor:
                exercise.difficulty === "iniciante"
                  ? "#4CAF50" + "20"
                  : exercise.difficulty === "intermediário"
                  ? "#FFC107" + "20"
                  : "#F44336" + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.exerciseDifficultyText,
              {
                color:
                  exercise.difficulty === "iniciante"
                    ? "#4CAF50"
                    : exercise.difficulty === "intermediário"
                    ? "#FFC107"
                    : "#F44336",
              },
            ]}
          >
            {exercise.difficulty}
          </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

// Componente para o filtro de grupo muscular
const MuscleGroupFilter = ({
  selectedMuscle,
  onSelectMuscle,
}: {
  selectedMuscle: string | null;
  onSelectMuscle: (muscle: string | null) => void;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.muscleFilterContainer}
    >
      <TouchableOpacity
        style={[
          styles.muscleFilterItem,
          selectedMuscle === null && { backgroundColor: colors.primary + "20" },
        ]}
        onPress={() => onSelectMuscle(null)}
      >
        <Text
          style={[
            styles.muscleFilterText,
            {
              color:
                selectedMuscle === null ? colors.primary : colors.text + "80",
            },
          ]}
        >
          Todos
        </Text>
      </TouchableOpacity>

      {muscleGroups.map((muscle, index) => (
        <TouchableOpacity
          key={`muscle-${index}`}
          style={[
            styles.muscleFilterItem,
            selectedMuscle === muscle && {
              backgroundColor: colors.primary + "20",
            },
          ]}
          onPress={() => onSelectMuscle(muscle)}
        >
          <Text
            style={[
              styles.muscleFilterText,
              {
                color:
                  selectedMuscle === muscle
                    ? colors.primary
                    : colors.text + "80",
              },
            ]}
          >
            {muscle}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default function AddExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Extrair parâmetros da URL
  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string;
  const workoutColor = (params.workoutColor as string) || colors.primary;

  // Contexto de treinos
  const { addExerciseToWorkout, getWorkoutTypeById, workouts } = useWorkoutContext();
  const workoutType = getWorkoutTypeById(workoutId);

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ExerciseData[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Efeito para carregar exercícios recentes
  useEffect(() => {
    // Carregar exercícios recentes do usuário
    if (workouts) {
      const recentExercisesList: Exercise[] = [];

      // Percorrer todas as datas
      Object.keys(workouts).forEach((date) => {
        // Percorrer todos os treinos da data
        Object.keys(workouts[date] || {}).forEach((workoutId) => {
          const exercises = workouts[date][workoutId];
          if (Array.isArray(exercises)) {
            exercises.forEach((exercise) => {
              // Verificar se o exercício já está na lista
              const existingExercise = recentExercisesList.find(
                (e) => e.name === exercise.name
              );
              if (!existingExercise) {
                recentExercisesList.push(exercise);
              }
            });
          }
        });
      });

      // Ordenar por ordem de adição (assumindo que os mais recentes estão no final do array)
      // e limitar a 5 itens
      setRecentExercises(recentExercisesList.slice(-5).reverse());
    }
  }, [workouts]);

  // Função de busca com debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        if (selectedMuscle) {
          setSearchResults(getExercisesByMuscle(selectedMuscle));
        } else {
          setSearchResults([]);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Pequeno delay para melhorar a experiência do usuário
      setTimeout(() => {
        const results = searchExercises(query);
        setSearchResults(results);
        setIsLoading(false);
      }, 300);
    }, 300),
    [selectedMuscle]
  );

  // Efeito para buscar exercícios quando a query mudar
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Função para selecionar um grupo muscular
  const handleSelectMuscle = useCallback((muscle: string | null) => {
    setSelectedMuscle(muscle);
    setSearchQuery("");

    if (muscle) {
      setIsLoading(true);
      setTimeout(() => {
        setSearchResults(getExercisesByMuscle(muscle));
        setIsLoading(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, []);

  // Função para adicionar exercício diretamente
  const handleQuickAdd = useCallback(
    (exercise: ExerciseData) => {
      const newExercise: Exercise = {
        id: `exercise-${Date.now()}`,
        name: exercise.name,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            reps: 12,
            weight: 10,
            completed: false,
          },
          {
            id: `set-${Date.now()}-2`,
            reps: 12,
            weight: 10,
            completed: false,
          },
          {
            id: `set-${Date.now()}-3`,
            reps: 12,
            weight: 10,
            completed: false,
          },
        ],
        notes: `${exercise.muscle} - ${exercise.equipment}`,
        completed: false,
        category: exercise.category,
      };

      addExerciseToWorkout(workoutId, newExercise);

      // Feedback tátil
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [workoutId, addExerciseToWorkout]
  );

  // Função para navegar para a tela de detalhes do exercício
  const navigateToExerciseDetails = useCallback(
    (exercise: ExerciseData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      router.push({
        pathname: "exercise-details",
        params: {
          exerciseId: exercise.id,
          workoutId,
          workoutColor,
        },
      });
    },
    [workoutId, workoutColor, router]
  );

  // Renderizar os resultados da pesquisa
  const renderSearchResults = () => {
    if (isLoading) {
      return <SearchResultsSkeleton />;
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum exercício encontrado para "{searchQuery}"
          </Text>
          <TouchableOpacity
            style={[styles.addCustomButton, { backgroundColor: workoutColor }]}
            onPress={() => {
              router.push({
                pathname: "exercise-details",
                params: {
                  customName: searchQuery,
                  workoutId,
                  workoutColor,
                },
              });
            }}
          >
            <Text style={styles.addCustomButtonText}>
              Adicionar como novo exercício
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return searchResults.map((exercise, index) => (
      <MotiView
        key={`${exercise.id}_${index}_${theme}`}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity
          key={`exercise-item-${exercise.id}-${theme}`}
          style={[styles.exerciseItem, { backgroundColor: colors.light }]}
          onPress={() => navigateToExerciseDetails(exercise)}
        >
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {exercise.name}
            </Text>
            <Text
              style={[styles.exerciseCategory, { color: colors.text + "80" }]}
            >
              {exercise.muscle} • {exercise.equipment} • {exercise.difficulty}
            </Text>
          </View>
          <TouchableOpacity
            key={`add-button-${exercise.id}-${theme}`}
            style={[styles.addButton, { backgroundColor: workoutColor }]}
            onPress={() => handleQuickAdd(exercise)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </MotiView>
    ));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          key={`back-button-${theme}`}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Adicionar Exercício
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {workoutType?.name || "Treino"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View
        key={`search-container-${theme}`}
        style={[styles.searchContainer, { backgroundColor: colors.light }]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.text}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar exercício..."
          placeholderTextColor={colors.text + "80"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            key={`clear-search-${theme}`}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle Group Filter */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.muscleFilterContainer}
          style={styles.filterScrollView}
        >
          <TouchableOpacity
            style={[
              styles.muscleFilterItem,
              selectedMuscle === null && {
                backgroundColor: workoutColor + "20",
              },
            ]}
            onPress={() => handleSelectMuscle(null)}
          >
            <Text
              style={[
                styles.muscleFilterText,
                {
                  color:
                    selectedMuscle === null ? workoutColor : colors.text + "80",
                },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {muscleGroups.map((muscle, index) => (
            <TouchableOpacity
              key={`muscle-${index}`}
              style={[
                styles.muscleFilterItem,
                selectedMuscle === muscle && {
                  backgroundColor: workoutColor + "20",
                },
              ]}
              onPress={() => handleSelectMuscle(muscle)}
            >
              <Text
                style={[
                  styles.muscleFilterText,
                  {
                    color:
                      selectedMuscle === muscle
                        ? workoutColor
                        : colors.text + "80",
                  },
                ]}
              >
                {muscle}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContentContainer}
      >
        {/* Exercícios Recentes */}
        {recentExercises.length > 0 && !searchQuery && !selectedMuscle && (
          <View
            key={`recent-exercises-${theme}`}
            style={styles.recentExercisesSection}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exercícios Recentes
            </Text>

            {recentExercises.map((exercise, index) => (
              <MotiView
                key={`recent_${exercise.id}_${index}_${theme}`}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 50 }}
              >
                <TouchableOpacity
                  key={`recent-exercise-${exercise.id}-${theme}`}
                  style={[
                    styles.exerciseItem,
                    { backgroundColor: colors.light },
                  ]}
                  onPress={() =>
                    navigateToExerciseDetails({
                      id: exercise.id,
                      name: exercise.name,
                      muscle: exercise.notes?.split(" - ")[0] || "",
                      equipment: exercise.notes?.split(" - ")[1] || "",
                      description: "",
                      difficulty: "intermediário",
                      category: exercise.category || "força",
                    })
                  }
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Text
                      style={[
                        styles.exerciseCategory,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {exercise.sets?.length || 0} séries •{" "}
                      {exercise.sets?.[0]?.reps || 0} reps •{" "}
                      {exercise.sets?.[0]?.weight || 0}kg
                    </Text>
                  </View>
                  <TouchableOpacity
                    key={`recent-add-button-${exercise.id}-${theme}`}
                    style={[
                      styles.addButton,
                      { backgroundColor: workoutColor },
                    ]}
                    onPress={() => {
                      const newExercise: Exercise = {
                        ...exercise,
                        id: `exercise-${Date.now()}`,
                        completed: false,
                        sets: exercise.sets?.map((set) => ({
                          ...set,
                          id: `set-${Date.now()}-${Math.random()}`,
                          completed: false,
                        })),
                      };
                      addExerciseToWorkout(workoutId, newExercise);
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );
                    }}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        )}

        {/* Resultados da Busca ou Exercícios Filtrados */}
        {(searchQuery.trim() || selectedMuscle) && renderSearchResults()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterWrapper: {
    height: 32,
    marginBottom: 0,
  },
  filterScrollView: {
    height: 32,
  },
  muscleFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    flexDirection: "row",
    height: 32,
  },
  muscleFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  muscleFilterText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsContentContainer: {
    paddingTop: 10,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  addCustomButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCustomButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 14,
  },
  skeletonExerciseName: {
    height: 16,
    width: width * 0.4,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonExerciseCategory: {
    height: 14,
    width: width * 0.6,
    borderRadius: 7,
  },
  skeletonAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  recentExercisesSection: {
    marginBottom: 20,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  exerciseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  exerciseCardContent: {
    padding: 16,
  },
  exerciseCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  exerciseDetails: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
  },
  exerciseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  exerciseDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseDifficulty: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  exerciseDifficultyText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
