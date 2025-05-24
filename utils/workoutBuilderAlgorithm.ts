import {
  ExerciseData,
  exerciseDatabase,
  getExercisesByMuscle,
} from "../data/exerciseDatabase";
import { Exercise, ExerciseSet } from "../context/WorkoutContext";
import { v4 as uuidv4 } from "uuid";

// Tipos para o construtor de treinos
export type ExperienceLevel =
  | "sedentary"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "athlete";
export type WorkoutGoal =
  | "strength"
  | "hypertrophy"
  | "endurance"
  | "weightloss"
  | "general";
export type WorkoutFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Dias por semana

export interface BuilderPreferences {
  gender: "male" | "female" | "other";
  experienceLevel: ExperienceLevel;
  selectedMuscles: string[];
  goal: WorkoutGoal;
  frequency?: WorkoutFrequency;
  timeAvailable?: number; // Em minutos
  preferredEquipment?: string[];
  avoidEquipment?: string[];
  excludeExercises?: string[]; // IDs de exercícios para evitar
}

export interface WorkoutTemplate {
  name: string;
  exercises: Exercise[];
  estimatedDuration: number; // Em minutos
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = fácil, 5 = muito difícil
  focusAreas: string[]; // Grupos musculares trabalhados
}

// Função principal para gerar treino personalizado
export const generatePersonalizedWorkout = (
  preferences: BuilderPreferences
): WorkoutTemplate => {
  // Determinar o número de exercícios baseado no nível de experiência
  const exerciseCount = getExerciseCountByLevel(preferences.experienceLevel);

  // Determinar configurações de séries e repetições baseadas no objetivo
  const setRepConfig = getSetRepConfigByGoal(preferences.goal);

  // Distribuir os exercícios entre os grupos musculares selecionados
  const muscleDistribution = distributeMuscleGroups(
    preferences.selectedMuscles,
    exerciseCount,
    preferences.experienceLevel
  );

  // Selecionar os exercícios específicos para cada grupo muscular
  const selectedExercises = selectExercisesForWorkout(
    muscleDistribution,
    preferences
  );

  // Criar as séries para cada exercício com base no objetivo
  const exercisesWithSets = addSetsToExercises(
    selectedExercises,
    setRepConfig,
    preferences.experienceLevel
  );

  // Determinar a duração estimada do treino
  const estimatedDuration = calculateWorkoutDuration(
    exercisesWithSets,
    preferences.experienceLevel
  );

  // Determinar a dificuldade do treino
  const difficulty = calculateWorkoutDifficulty(
    preferences.experienceLevel,
    exercisesWithSets
  );

  // Criar o template do treino
  const workoutTemplate: WorkoutTemplate = {
    name: generateWorkoutName(preferences.selectedMuscles, preferences.goal),
    exercises: exercisesWithSets,
    estimatedDuration,
    difficulty,
    focusAreas: preferences.selectedMuscles,
  };

  return workoutTemplate;
};

// Função para determinar número de exercícios por nível
const getExerciseCountByLevel = (level: ExperienceLevel): number => {
  switch (level) {
    case "sedentary":
      return 4;
    case "beginner":
      return 6;
    case "intermediate":
      return 8;
    case "advanced":
      return 10;
    case "athlete":
      return 12;
    default:
      return 6;
  }
};

// Configurações de séries/repetições por objetivo
const getSetRepConfigByGoal = (
  goal: WorkoutGoal
): { sets: number; minReps: number; maxReps: number; restTime: number } => {
  switch (goal) {
    case "strength":
      return { sets: 4, minReps: 4, maxReps: 6, restTime: 180 }; // Mais pesado, menos reps, mais descanso
    case "hypertrophy":
      return { sets: 3, minReps: 8, maxReps: 12, restTime: 90 }; // Médio pesado, reps médias, descanso médio
    case "endurance":
      return { sets: 3, minReps: 15, maxReps: 20, restTime: 60 }; // Mais leve, mais reps, menos descanso
    case "weightloss":
      return { sets: 3, minReps: 12, maxReps: 15, restTime: 45 }; // Circuito, menos descanso
    case "general":
      return { sets: 3, minReps: 10, maxReps: 12, restTime: 60 }; // Equilibrado
    default:
      return { sets: 3, minReps: 10, maxReps: 12, restTime: 60 };
  }
};

// Distribuir quantidade de exercícios por grupo muscular
const distributeMuscleGroups = (
  selectedMuscles: string[],
  totalExercises: number,
  experienceLevel: ExperienceLevel
): Record<string, number> => {
  const distribution: Record<string, number> = {};

  // Se há apenas um grupo muscular, todos os exercícios vão para ele
  if (selectedMuscles.length === 1) {
    distribution[selectedMuscles[0]] = totalExercises;
    return distribution;
  }

  // Distribuição inicial igualitária
  const baseExercisesPerMuscle = Math.floor(
    totalExercises / selectedMuscles.length
  );
  let remainingExercises =
    totalExercises - baseExercisesPerMuscle * selectedMuscles.length;

  selectedMuscles.forEach((muscle) => {
    distribution[muscle] = baseExercisesPerMuscle;
  });

  // Distribuir os exercícios restantes para os grupos maiores primeiro
  const largerMuscleGroups = ["Costas", "Pernas", "Peito", "Corpo inteiro"];

  for (const muscle of selectedMuscles) {
    if (remainingExercises <= 0) break;
    if (largerMuscleGroups.includes(muscle)) {
      distribution[muscle] += 1;
      remainingExercises -= 1;
    }
  }

  // Se ainda sobrarem, distribuir para os demais grupos
  for (const muscle of selectedMuscles) {
    if (remainingExercises <= 0) break;
    if (!largerMuscleGroups.includes(muscle)) {
      distribution[muscle] += 1;
      remainingExercises -= 1;
    }
  }

  return distribution;
};

// Selecionar exercícios específicos para cada grupo muscular
const selectExercisesForWorkout = (
  muscleDistribution: Record<string, number>,
  preferences: BuilderPreferences
): ExerciseData[] => {
  const selectedExercises: ExerciseData[] = [];
  const {
    gender,
    experienceLevel,
    preferredEquipment,
    avoidEquipment,
    excludeExercises,
  } = preferences;

  // Para cada grupo muscular, selecionar a quantidade de exercícios indicada
  Object.entries(muscleDistribution).forEach(([muscle, count]) => {
    // Obter todos os exercícios do grupo muscular
    let exercisesForMuscle = getExercisesByMuscle(muscle);

    // Filtrar por equipamento preferido (se especificado)
    if (preferredEquipment && preferredEquipment.length > 0) {
      const filtered = exercisesForMuscle.filter((ex) =>
        preferredEquipment.includes(ex.equipment)
      );

      // Só usar o filtro se não reduzir demais as opções
      if (filtered.length >= count) {
        exercisesForMuscle = filtered;
      }
    }

    // Excluir equipamentos a serem evitados
    if (avoidEquipment && avoidEquipment.length > 0) {
      exercisesForMuscle = exercisesForMuscle.filter(
        (ex) => !avoidEquipment.includes(ex.equipment)
      );
    }

    // Excluir exercícios específicos
    if (excludeExercises && excludeExercises.length > 0) {
      exercisesForMuscle = exercisesForMuscle.filter(
        (ex) => !excludeExercises.includes(ex.id)
      );
    }

    // Adaptações baseadas no gênero (opcional)
    if (gender === "female") {
      // Priorizar exercícios que funcionam bem para mulheres
      // (exemplo: mais foco em glúteos, menos peito)
      // Esta é apenas uma sugestão, e pode ser personalizada ou removida
      if (muscle === "Glúteos") {
        const gluteExercises = exercisesForMuscle.filter(
          (ex) => ex.muscle === "Glúteos"
        );
        if (gluteExercises.length > 0) {
          exercisesForMuscle = [
            ...gluteExercises,
            ...exercisesForMuscle.filter((ex) => ex.muscle !== "Glúteos"),
          ];
        }
      }
    }

    // Adaptar dificuldade com base no nível
    exercisesForMuscle = adaptExerciseDifficulty(
      exercisesForMuscle,
      experienceLevel
    );

    // Embaralhar para pegar aleatoriamente
    const shuffled = exercisesForMuscle.sort(() => 0.5 - Math.random());

    // Selecionar a quantidade necessária de exercícios
    selectedExercises.push(...shuffled.slice(0, count));
  });

  // Ordenar para melhor fluxo de treino (grandes grupos primeiro)
  return orderExercisesForWorkout(selectedExercises);
};

// Adaptar seleção de exercícios por dificuldade
const adaptExerciseDifficulty = (
  exercises: ExerciseData[],
  level: ExperienceLevel
): ExerciseData[] => {
  // Classificação relativa de complexidade de equipamentos
  const equipmentComplexity: Record<string, number> = {
    "Sem equipamento": 1,
    Halteres: 2,
    Máquina: 2,
    Cabo: 3,
    Barra: 4,
    Kettlebell: 4,
    TRX: 5,
    Anéis: 5,
  };

  // Para iniciantes, favorecer equipamentos mais simples
  if (level === "sedentary" || level === "beginner") {
    return exercises.sort((a, b) => {
      const complexityA = equipmentComplexity[a.equipment] || 3;
      const complexityB = equipmentComplexity[b.equipment] || 3;
      return complexityA - complexityB;
    });
  }

  // Para avançados, incluir equipamentos mais complexos
  if (level === "advanced" || level === "athlete") {
    return exercises.sort((a, b) => {
      const complexityA = equipmentComplexity[a.equipment] || 3;
      const complexityB = equipmentComplexity[b.equipment] || 3;
      return complexityB - complexityA; // Ordem invertida para priorizar os mais complexos
    });
  }

  return exercises; // Sem alteração para intermediários
};

// Ordenar exercícios para melhor fluxo de treino
const orderExercisesForWorkout = (
  exercises: ExerciseData[]
): ExerciseData[] => {
  // Ordem de prioridade para grupos musculares
  const musclePriority: Record<string, number> = {
    "Corpo inteiro": 1,
    Costas: 2,
    Pernas: 3,
    Peito: 4,
    Ombros: 5,
    Bíceps: 6,
    Tríceps: 7,
    Abdômen: 8,
    Glúteos: 9,
    Panturrilha: 10,
    Lombar: 11,
    Antebraço: 12,
    Trapézio: 13,
    Cardio: 14,
  };

  // Ordenar por grupo muscular (grandes grupos primeiro)
  return [...exercises].sort((a, b) => {
    const priorityA = musclePriority[a.muscle] || 99;
    const priorityB = musclePriority[b.muscle] || 99;
    return priorityA - priorityB;
  });
};

// Adicionar séries aos exercícios
const addSetsToExercises = (
  exercises: ExerciseData[],
  setRepConfig: {
    sets: number;
    minReps: number;
    maxReps: number;
    restTime: number;
  },
  experienceLevel: ExperienceLevel
): Exercise[] => {
  return exercises.map((exercise) => {
    // Criar as séries para o exercício
    const sets: ExerciseSet[] = [];

    let reps = setRepConfig.minReps;

    // Para exercícios de peso corporal, podemos aumentar o número de repetições
    const isBodyweight = exercise.isBodyweightExercise;
    if (isBodyweight) {
      reps = Math.round(reps * 1.5); // 50% mais repetições para exercícios com peso corporal
    }

    // Ajustar o peso inicial com base no nível de experiência e tipo de exercício
    let initialWeight = determineInitialWeight(exercise, experienceLevel);

    // Criar séries para o exercício
    for (let i = 0; i < setRepConfig.sets; i++) {
      // Para pirâmide crescente, aumentar peso e diminuir reps em séries sucessivas
      const setWeight = isBodyweight
        ? 0
        : initialWeight + i * exercise.weightIncrement * 0.5; // Aumentar 50% do incremento por série

      const setReps = isBodyweight
        ? reps
        : Math.max(setRepConfig.minReps, setRepConfig.maxReps - i); // Diminuir reps em cada série

      sets.push({
        id: uuidv4(),
        weight: setWeight,
        reps: setReps,
        completed: false,
        restTime: setRepConfig.restTime,
        isBodyweightExercise: isBodyweight,
      });
    }

    return {
      id: exercise.id,
      name: exercise.name,
      sets: sets,
      category: exercise.category,
      isBodyweightExercise: exercise.isBodyweightExercise,
    };
  });
};

// Determinar o peso inicial baseado no nível e tipo de exercício
const determineInitialWeight = (
  exercise: ExerciseData,
  level: ExperienceLevel
): number => {
  // Se for exercício de peso corporal, retornar 0
  if (exercise.isBodyweightExercise) {
    return 0;
  }

  // Multiplicadores base por nível de experiência
  const levelMultiplier: Record<ExperienceLevel, number> = {
    sedentary: 0.5,
    beginner: 1,
    intermediate: 1.5,
    advanced: 2,
    athlete: 2.5,
  };

  // Pesos base por grupo muscular (em kg)
  const muscleBaseWeight: Record<string, number> = {
    Peito: 10,
    Costas: 10,
    Pernas: 15,
    Ombros: 6,
    Bíceps: 6,
    Tríceps: 6,
    Abdômen: 5,
    Glúteos: 10,
    Antebraço: 4,
    Panturrilha: 10,
    Lombar: 10,
    Trapézio: 8,
    "Corpo inteiro": 10,
    Cardio: 0,
  };

  // Multiplicadores por equipamento
  const equipmentMultiplier: Record<string, number> = {
    Barra: 2,
    Halteres: 1,
    Máquina: 1.5,
    Cabo: 1,
    Kettlebell: 1,
    Elástico: 0.5,
    Bola: 0.5,
    TRX: 0,
    "Sem equipamento": 0,
  };

  // Calcular o peso inicial
  const baseWeight = muscleBaseWeight[exercise.muscle] || 5;
  const experienceMultiplier = levelMultiplier[level];
  const equipMultiplier = equipmentMultiplier[exercise.equipment] || 1;

  let initialWeight = baseWeight * experienceMultiplier * equipMultiplier;

  // Arredondar para o incremento mais próximo
  const increment = exercise.weightIncrement;
  initialWeight = Math.round(initialWeight / increment) * increment;

  return initialWeight;
};

// Calcular a duração estimada do treino
const calculateWorkoutDuration = (
  exercises: Exercise[],
  level: ExperienceLevel
): number => {
  // Tempo médio por série (em segundos)
  const timePerSet = 45;

  // Duração total das séries
  let totalSets = 0;
  let totalRestTime = 0;

  exercises.forEach((exercise) => {
    if (exercise.sets) {
      totalSets += exercise.sets.length;

      // Somar tempo de descanso
      exercise.sets.forEach((set) => {
        if (set.restTime) {
          totalRestTime += set.restTime;
        }
      });
    }
  });

  // Tempo estimado para trocar de exercício e preparar (em segundos)
  const setupTimePerExercise = 60;

  // Tempo total em segundos
  const totalTimeSeconds =
    totalSets * timePerSet + // Tempo para realizar as séries
    totalRestTime + // Tempo de descanso entre séries
    exercises.length * setupTimePerExercise; // Tempo para preparação

  // Adicionar tempo para aquecimento e alongamento
  const warmupTime = level === "sedentary" || level === "beginner" ? 300 : 180; // 5 ou 3 minutos
  const stretchingTime = 180; // 3 minutos

  // Conversão para minutos e arredondamento
  return Math.ceil((totalTimeSeconds + warmupTime + stretchingTime) / 60);
};

// Calcular a dificuldade do treino (1-5)
const calculateWorkoutDifficulty = (
  level: ExperienceLevel,
  exercises: Exercise[]
): 1 | 2 | 3 | 4 | 5 => {
  // Tabela de dificuldade base por nível
  const baseDifficulty: Record<ExperienceLevel, number> = {
    sedentary: 1,
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    athlete: 5,
  };

  // Obter dificuldade base
  let difficulty = baseDifficulty[level];

  // Ajustar com base no volume do treino (séries totais)
  let totalSets = 0;
  exercises.forEach((exercise) => {
    if (exercise.sets) {
      totalSets += exercise.sets.length;
    }
  });

  // Ajustar dificuldade com base no volume
  if (totalSets < 10) difficulty = Math.max(1, difficulty - 1);
  if (totalSets > 20) difficulty = Math.min(5, difficulty + 1);

  return difficulty as 1 | 2 | 3 | 4 | 5;
};

// Gerar nome para o treino
const generateWorkoutName = (
  muscleGroups: string[],
  goal: WorkoutGoal
): string => {
  if (muscleGroups.length === 1) {
    return `Treino de ${muscleGroups[0]}`;
  }

  if (muscleGroups.length === 2) {
    return `Treino de ${muscleGroups[0]} e ${muscleGroups[1]}`;
  }

  if (muscleGroups.length > 2) {
    // Verificar se são complementares
    const upperBodyGroups = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps"];
    const lowerBodyGroups = ["Pernas", "Glúteos", "Panturrilha"];

    const hasUpperBody = muscleGroups.some((muscle) =>
      upperBodyGroups.includes(muscle)
    );
    const hasLowerBody = muscleGroups.some((muscle) =>
      lowerBodyGroups.includes(muscle)
    );

    if (hasUpperBody && !hasLowerBody) {
      return "Treino de Membros Superiores";
    }

    if (hasLowerBody && !hasUpperBody) {
      return "Treino de Membros Inferiores";
    }

    if (
      muscleGroups.includes("Corpo inteiro") ||
      (hasUpperBody && hasLowerBody)
    ) {
      return "Treino Completo";
    }
  }

  // Nomes baseados no objetivo
  const goalNames: Record<WorkoutGoal, string> = {
    strength: "Treino de Força",
    hypertrophy: "Treino de Hipertrofia",
    endurance: "Treino de Resistência",
    weightloss: "Treino para Perda de Peso",
    general: "Treino Completo",
  };

  return goalNames[goal];
};

// Função para salvar um template como treino personalizado
export const saveWorkoutTemplate = (template: WorkoutTemplate) => {
  // Implementação para salvar no AsyncStorage ou banco de dados
  // Esta função será implementada posteriormente

  // Retornar ID do treino salvo para referência
  return uuidv4();
};
