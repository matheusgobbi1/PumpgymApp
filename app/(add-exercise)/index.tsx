import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/common/ToastContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.44;

// Componente para o card de exercício - otimizado com memo
const ExerciseCard = React.memo(
  ({
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
    const { t } = useTranslation();

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
                  : exercise.muscle === "Bíceps" ||
                    exercise.muscle === "Tríceps"
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
            {exercise.id.startsWith("exercise-")
              ? exercise.name
              : exercise.id &&
                exercise.id.startsWith("ex") &&
                exercise.id.length <= 6
              ? t(`exercises.exercises.${exercise.id}`)
              : exercise.name}
          </Text>

          <View style={styles.exerciseDetails}>
            <View style={styles.exerciseDetailItem}>
              <Ionicons
                name="body-outline"
                size={14}
                color={colors.text + "80"}
              />
              <Text
                style={[
                  styles.exerciseDetailText,
                  { color: colors.text + "80" },
                ]}
              >
                {t(`exercises.muscles.${exercise.muscle}`)}
              </Text>
            </View>

            <View style={styles.exerciseDetailItem}>
              <Ionicons
                name="barbell-outline"
                size={14}
                color={colors.text + "80"}
              />
              <Text
                style={[
                  styles.exerciseDetailText,
                  { color: colors.text + "80" },
                ]}
              >
                {t(`exercises.equipment.${exercise.equipment}`)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }
);

// Componente para o filtro de grupo muscular
const MuscleGroupFilter = React.memo(
  ({
    selectedMuscle,
    onSelectMuscle,
    workoutColor,
  }: {
    selectedMuscle: string | null;
    onSelectMuscle: (muscle: string | null) => void;
    workoutColor: string;
  }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { t } = useTranslation();

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.muscleFilterContainer}
      >
        <TouchableOpacity
          style={[
            styles.muscleFilterItem,
            selectedMuscle === null && { backgroundColor: workoutColor + "20" },
          ]}
          onPress={() => onSelectMuscle(null)}
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
            {t("exercise.muscleGroups.all")}
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
            onPress={() => onSelectMuscle(muscle)}
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
              {t(`exercises.muscles.${muscle}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }
);

// Item de exercício recente
const RecentExerciseItem = React.memo(
  ({
    exercise,
    index,
    theme,
    workoutColor,
    colors,
    navigateToExerciseDetails,
    workoutId,
    addExerciseToWorkout,
    t,
    showToast,
  }: {
    exercise: Exercise;
    index: number;
    theme: string;
    workoutColor: string;
    colors: any;
    navigateToExerciseDetails: Function;
    workoutId: string;
    addExerciseToWorkout: Function;
    t: Function;
    showToast: Function;
  }) => (
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
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        onPress={() => navigateToExerciseDetails(exercise)}
      >
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {exercise.id &&
            exercise.id.startsWith("ex") &&
            exercise.id.length <= 6
              ? t(`exercises.exercises.${exercise.id}`)
              : exercise.name}
          </Text>
          <Text
            style={[styles.exerciseCategory, { color: colors.text + "80" }]}
          >
            {exercise.category === "cardio"
              ? `${exercise.cardioDuration || 30} min • ${
                  exercise.cardioIntensity && exercise.cardioIntensity <= 3
                    ? "Baixa"
                    : exercise.cardioIntensity && exercise.cardioIntensity >= 8
                    ? "Alta"
                    : "Média"
                } ${exercise.cardioIntensity || 5}/10`
              : `${exercise.sets?.length || 0} séries • ${
                  exercise.sets?.[0]?.reps || 0
                } reps • ${
                  exercise.isBodyweightExercise
                    ? t("exercise.bodyweight.short")
                    : `${exercise.sets?.[0]?.weight || 0}kg`
                }`}
          </Text>
        </View>
        <TouchableOpacity
          key={`recent-add-button-${exercise.id}-${theme}`}
          style={[styles.addButton, { backgroundColor: workoutColor }]}
          onPress={() => {
            const exerciseId =
              exercise.id &&
              exercise.id.startsWith("ex") &&
              exercise.id.length <= 6
                ? exercise.id
                : `exercise-${Date.now()}`;

            const exerciseName =
              exercise.id &&
              exercise.id.startsWith("ex") &&
              exercise.id.length <= 6
                ? t(`exercises.exercises.${exercise.id}`)
                : exercise.name;

            const newExercise: Exercise = {
              id: exerciseId,
              name: exerciseName,
              notes: exercise.notes,
              category: exercise.category,
              completed: false,
              isBodyweightExercise: exercise.isBodyweightExercise,
              sets:
                exercise.category === "cardio"
                  ? []
                  : (exercise.sets || []).map((set) => ({
                      id: `set-${Date.now()}-${Math.random()}`,
                      reps: set.reps,
                      weight: set.weight,
                      restTime: set.restTime || 60,
                      completed: false,
                      isBodyweightExercise: exercise.isBodyweightExercise,
                    })),
              // Copiar configurações de cardio se for um exercício de cardio
              cardioDuration:
                exercise.category === "cardio"
                  ? exercise.cardioDuration || 30
                  : undefined,
              cardioIntensity:
                exercise.category === "cardio"
                  ? exercise.cardioIntensity || 5
                  : undefined,
            };
            addExerciseToWorkout(workoutId, newExercise);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Mostrar toast de sucesso
            showToast({
              message: t("exercise.addedSuccess", {
                defaultValue: `${exerciseName} adicionado ao treino`,
              }),
              type: "success",
              position: "bottom",
            });
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </MotiView>
  )
);

// Item de resultado de busca
const SearchResultItem = React.memo(
  ({
    exercise,
    index,
    theme,
    workoutColor,
    colors,
    navigateToExerciseDetails,
    addExerciseToWorkout,
    workoutId,
    t,
    showToast,
  }: {
    exercise: ExerciseData;
    index: number;
    theme: string;
    workoutColor: string;
    colors: any;
    navigateToExerciseDetails: Function;
    addExerciseToWorkout: Function;
    workoutId: string;
    t: Function;
    showToast: Function;
  }) => (
    <MotiView
      key={`${exercise.id}_${index}_${theme}`}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity
        key={`exercise-item-${exercise.id}-${theme}`}
        style={[
          styles.exerciseItem,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        onPress={() => navigateToExerciseDetails(exercise)}
      >
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {exercise.id.startsWith("exercise-")
              ? exercise.name
              : exercise.id &&
                exercise.id.startsWith("ex") &&
                exercise.id.length <= 6
              ? t(`exercises.exercises.${exercise.id}`)
              : exercise.name}
          </Text>
          <Text
            style={[styles.exerciseCategory, { color: colors.text + "80" }]}
          >
            {t(`exercises.muscles.${exercise.muscle}`)} •{" "}
            {t(`exercises.equipment.${exercise.equipment}`)}
            {exercise.isBodyweightExercise
              ? " • " + t("exercise.bodyweight")
              : ""}
          </Text>
        </View>
        <TouchableOpacity
          key={`add-button-${exercise.id}-${theme}`}
          style={[styles.addButton, { backgroundColor: workoutColor }]}
          onPress={() => {
            const exerciseId =
              exercise.id &&
              exercise.id.startsWith("ex") &&
              exercise.id.length <= 6
                ? exercise.id
                : `exercise-${Date.now()}`;

            const exerciseName =
              exercise.id &&
              exercise.id.startsWith("ex") &&
              exercise.id.length <= 6
                ? t(`exercises.exercises.${exercise.id}`)
                : exercise.name;

            const newExercise: Exercise = {
              id: exerciseId,
              name: exerciseName,
              category: exercise.category,
              notes: `${exercise.muscle} - ${exercise.equipment}`,
              isBodyweightExercise: exercise.isBodyweightExercise,
              sets:
                exercise.category === "cardio"
                  ? []
                  : [
                      {
                        id: `set-${Date.now()}-1`,
                        reps: 12,
                        weight: exercise.isBodyweightExercise ? 0 : 10,
                        completed: false,
                        restTime: 60,
                        isBodyweightExercise: exercise.isBodyweightExercise,
                      },
                      {
                        id: `set-${Date.now()}-2`,
                        reps: 12,
                        weight: exercise.isBodyweightExercise ? 0 : 10,
                        completed: false,
                        restTime: 60,
                        isBodyweightExercise: exercise.isBodyweightExercise,
                      },
                      {
                        id: `set-${Date.now()}-3`,
                        reps: 12,
                        weight: exercise.isBodyweightExercise ? 0 : 10,
                        completed: false,
                        restTime: 60,
                        isBodyweightExercise: exercise.isBodyweightExercise,
                      },
                    ],
              completed: false,
              // Definir valores padrão para cardio
              cardioDuration: exercise.category === "cardio" ? 30 : undefined,
              cardioIntensity: exercise.category === "cardio" ? 5 : undefined,
            };
            addExerciseToWorkout(workoutId, newExercise);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Mostrar toast de sucesso
            showToast({
              message: t("exercise.addedSuccess", {
                defaultValue: `${exerciseName} adicionado ao treino`,
              }),
              type: "success",
              position: "bottom",
            });
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </MotiView>
  )
);

export default function AddExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Extrair parâmetros da URL
  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string;
  const workoutColor = (params.workoutColor as string) || colors.primary;

  // Contexto de treinos
  const { addExerciseToWorkout, getWorkoutTypeById, workouts } =
    useWorkoutContext();
  const workoutType = getWorkoutTypeById(workoutId);

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExerciseData[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Efeito para carregar exercícios recentes - otimizado com useMemo
  useEffect(() => {
    // Carregar exercícios recentes do usuário
    if (workouts) {
      const recentExercisesList: Exercise[] = [];

      // Usar Object.entries para melhor performance
      Object.entries(workouts).forEach(([date, dateWorkouts]) => {
        if (dateWorkouts) {
          Object.entries(dateWorkouts).forEach(([wkId, exercises]) => {
            if (Array.isArray(exercises)) {
              exercises.forEach((exercise) => {
                if (
                  !recentExercisesList.some((e) => e.name === exercise.name)
                ) {
                  recentExercisesList.push(exercise);
                }
              });
            }
          });
        }
      });

      // Ordenar e limitar a 5 itens
      setRecentExercises(recentExercisesList.slice(-5).reverse());
    }
  }, [workouts]);

  // Função de busca com debounce - otimizada
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        if (selectedMuscle) {
          // Usar requestAnimationFrame para melhorar a performance
          requestAnimationFrame(() => {
            setSearchResults(getExercisesByMuscle(selectedMuscle));
          });
        } else {
          setSearchResults([]);
        }
        return;
      }

      // Usar requestAnimationFrame para separar a busca da renderização
      requestAnimationFrame(() => {
        const results = searchExercises(query);
        setSearchResults(results);
      });
    }, 300),
    [selectedMuscle]
  );

  // Efeito para buscar exercícios quando a query mudar
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Função para selecionar um grupo muscular - otimizada com useCallback
  const handleSelectMuscle = useCallback(
    (muscle: string | null) => {
      if (muscle === selectedMuscle) return; // Evita re-renderizações desnecessárias

      setSelectedMuscle(muscle);
      setSearchQuery("");

      if (muscle) {
        // Usar requestAnimationFrame para melhorar a performance
        requestAnimationFrame(() => {
          const results = getExercisesByMuscle(muscle);
          setSearchResults(results);
        });
      } else {
        setSearchResults([]);
      }
    },
    [selectedMuscle]
  );

  // Função para adicionar exercício diretamente - otimizada com useCallback e memo
  const handleQuickAdd = useCallback(
    (exercise: ExerciseData) => {
      const exerciseId =
        exercise.id && exercise.id.startsWith("ex") && exercise.id.length <= 6
          ? exercise.id
          : `exercise-${Date.now()}`;

      const exerciseName =
        exercise.id && exercise.id.startsWith("ex") && exercise.id.length <= 6
          ? t(`exercises.exercises.${exercise.id}`)
          : exercise.name;

      const newExercise: Exercise = {
        id: exerciseId,
        name: exerciseName,
        category: exercise.category,
        notes: `${exercise.muscle} - ${exercise.equipment}`,
        isBodyweightExercise: exercise.isBodyweightExercise,
        sets:
          exercise.category === "cardio"
            ? []
            : [
                {
                  id: `set-${Date.now()}-1`,
                  reps: 12,
                  weight: exercise.isBodyweightExercise ? 0 : 10,
                  completed: false,
                  restTime: 60,
                  isBodyweightExercise: exercise.isBodyweightExercise,
                },
                {
                  id: `set-${Date.now()}-2`,
                  reps: 12,
                  weight: exercise.isBodyweightExercise ? 0 : 10,
                  completed: false,
                  restTime: 60,
                  isBodyweightExercise: exercise.isBodyweightExercise,
                },
                {
                  id: `set-${Date.now()}-3`,
                  reps: 12,
                  weight: exercise.isBodyweightExercise ? 0 : 10,
                  completed: false,
                  restTime: 60,
                  isBodyweightExercise: exercise.isBodyweightExercise,
                },
              ],
        completed: false,
        // Definir valores padrão para cardio
        cardioDuration: exercise.category === "cardio" ? 30 : undefined,
        cardioIntensity: exercise.category === "cardio" ? 5 : undefined,
      };

      addExerciseToWorkout(workoutId, newExercise);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mostrar toast de sucesso
      showToast({
        message: t("exercise.addedSuccess", {
          defaultValue: `${exerciseName} adicionado ao treino`,
        }),
        type: "success",
        position: "bottom",
      });
    },
    [workoutId, addExerciseToWorkout, t, showToast]
  );

  // Função para navegar para a tela de detalhes do exercício - otimizada
  const navigateToExerciseDetails = useCallback(
    (exercise: ExerciseData | Exercise) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Verificar se é um Exercise (com sets) ou ExerciseData (sem sets)
      if ("sets" in exercise) {
        // É um exercício do histórico recente, passar como exerciseData
        router.push({
          pathname: "/(add-exercise)/exercise-details",
          params: {
            exerciseId: exercise.id,
            workoutId,
            workoutColor,
            mode: "edit",
            exerciseData: JSON.stringify(exercise),
            fromRecent: "true", // Indicar que vem do histórico recente
          },
        });
      } else {
        // É um exercício do banco de dados
        router.push({
          pathname: "/(add-exercise)/exercise-details",
          params: {
            exerciseId: exercise.id,
            workoutId,
            workoutColor,
            isBodyweightExercise: exercise.isBodyweightExercise
              ? "true"
              : "false",
          },
        });
      }
    },
    [workoutId, workoutColor, router]
  );

  // Memoizar os resultados para evitar re-renderizações desnecessárias
  const renderSearchResults = useCallback(() => {
    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t("exercise.noExercisesFound")} "{searchQuery}"
          </Text>
          <TouchableOpacity
            style={[styles.addCustomButton, { backgroundColor: workoutColor }]}
            onPress={() => {
              router.push({
                pathname: "/(add-exercise)/exercise-details",
                params: {
                  customName: searchQuery,
                  workoutId,
                  workoutColor,
                },
              });
            }}
          >
            <Text style={styles.addCustomButtonText}>
              {t("exercise.addAsNewExercise")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Limitar resultados para melhorar performance
    const limitedResults = searchResults.slice(0, 15);

    return limitedResults.map((exercise, index) => (
      <SearchResultItem
        key={`search-result-${exercise.id}-${index}`}
        exercise={exercise}
        index={index}
        theme={theme}
        workoutColor={workoutColor}
        colors={colors}
        navigateToExerciseDetails={navigateToExerciseDetails}
        addExerciseToWorkout={addExerciseToWorkout}
        workoutId={workoutId}
        t={t}
        showToast={showToast}
      />
    ));
  }, [
    searchResults,
    searchQuery,
    colors,
    workoutColor,
    theme,
    t,
    navigateToExerciseDetails,
    addExerciseToWorkout,
    workoutId,
    router,
    showToast,
  ]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: Platform.OS === "ios" ? 70 : 50 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("exercise.add")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {workoutType?.name || t("training.title")}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar com borda */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.text}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t("exercise.search")}
          placeholderTextColor={colors.text + "80"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle Group Filter */}
      <View style={styles.filterWrapper}>
        <MuscleGroupFilter
          selectedMuscle={selectedMuscle}
          onSelectMuscle={handleSelectMuscle}
          workoutColor={workoutColor}
        />
      </View>

      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContentContainer}
      >
        {/* Exercícios Recentes */}
        {recentExercises.length > 0 && !searchQuery && !selectedMuscle && (
          <View style={styles.recentExercisesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("exercise.recentExercises")}
            </Text>

            {recentExercises.map((exercise, index) => (
              <RecentExerciseItem
                key={`recent-exercise-item-${exercise.id}-${index}`}
                exercise={exercise}
                index={index}
                theme={theme}
                workoutColor={workoutColor}
                colors={colors}
                navigateToExerciseDetails={navigateToExerciseDetails}
                workoutId={workoutId}
                addExerciseToWorkout={addExerciseToWorkout}
                t={t}
                showToast={showToast}
              />
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
    borderRadius: 20,
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
    marginBottom: 10,
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
});
