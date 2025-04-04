import { ExerciseSet, Exercise } from "../context/WorkoutContext";
import {
  ExerciseData,
  getExerciseById,
  exerciseDatabase,
} from "../data/exerciseDatabase";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

// Interface para sugestões de progressão
export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  previousSets: ExerciseSet[];
  suggestedSets: ExerciseSet[];
  progressionType:
    | "weight"
    | "reps"
    | "rest"
    | "volume"
    | "technique"
    | "combined"
    | "deload"
    | "sets";
  reasonForSuggestion: string;
  difficultyLevel: "easy" | "moderate" | "challenging";
}

// Novo tipo para histórico de exercícios
export interface ExerciseHistory {
  exerciseName: string;
  dates: string[];
  exercises: Exercise[];
}

// Constantes para limites do algoritmo
const MAX_REST_TIME = 180; // Máximo de 3 minutos (180s) de descanso
const MAX_REPS = 12; // Máximo de repetições recomendadas
const MIN_REST_TIME = 30; // Mínimo de 30s de descanso
const OPTIMAL_RIR_RANGE = { min: 0, max: 2 }; // RIR ideal entre 0-2 para hipertrofia

// Função para obter a tradução de uma chave
function getTranslation(key: string): string {
  // Se i18next não estiver inicializado ou a chave não existir, retornar uma string padrão
  if (!i18next.isInitialized || !i18next.exists(key)) {
    // Retornar última parte da chave como texto de fallback
    const fallbackText = key.split(".").pop() || key;
    return fallbackText;
  }

  return i18next.t(key);
}

/**
 * Função para encontrar um exercício pelo nome
 * Usada quando o ID do exercício não corresponde ao ID no banco de dados
 */
export function getExerciseByName(name: string): ExerciseData | undefined {
  return exerciseDatabase.find(
    (exercise) => exercise.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Encontra o exercício no banco de dados, tentando por ID primeiro e depois por nome
 */
export function findExerciseData(exercise: Exercise): ExerciseData | undefined {
  // Primeiro, tentar obter pelo ID
  let exerciseData = getExerciseById(exercise.id);

  // Se não encontrou pelo ID, tenta pelo nome
  if (!exerciseData && exercise.name) {
    exerciseData = getExerciseByName(exercise.name);
  }

  return exerciseData;
}

/**
 * Avalia o nível de intensidade com base em falha muscular, RIR e percepção de esforço
 * Retorna um valor entre 0 (baixa intensidade) e 10 (intensidade máxima)
 */
function evaluateIntensity(set: ExerciseSet): number {
  // Valores padrão se não estiverem definidos
  const toFailure = set.toFailure || false;
  const repsInReserve = set.repsInReserve !== undefined ? set.repsInReserve : 2;
  const perceivedEffort =
    set.perceivedEffort !== undefined ? set.perceivedEffort : 3;

  let intensityScore = 5; // Valor médio padrão

  // Ajustar com base na falha muscular
  if (toFailure) {
    intensityScore += 3;
  }

  // Ajustar com base nas repetições em reserva (RIR)
  // RIR baixo = alta intensidade
  intensityScore += 5 - repsInReserve;

  // Ajustar com base na percepção de esforço
  // Percepção alta = alta intensidade
  intensityScore += perceivedEffort - 3;

  // Limitar entre 0 e 10
  return Math.max(0, Math.min(10, intensityScore));
}

/**
 * Obtém o valor médio de RIR das séries
 */
function getAvgRIR(sets: ExerciseSet[]): number {
  const validSets = sets.filter((set) => set.repsInReserve !== undefined);
  if (validSets.length === 0) return 2; // Valor padrão se não tiver dados
  return average(validSets.map((set) => set.repsInReserve || 2));
}

/**
 * Obtém o valor médio de percepção de esforço das séries
 */
function getAvgPerceivedEffort(sets: ExerciseSet[]): number {
  const validSets = sets.filter((set) => set.perceivedEffort !== undefined);
  if (validSets.length === 0) return 3; // Valor padrão se não tiver dados
  return average(validSets.map((set) => set.perceivedEffort || 3));
}

/**
 * Verifica se dois treinos são considerados idênticos (mesmo exercício, mesmas séries)
 */
function areWorkoutsSimilar(exercise1: Exercise, exercise2: Exercise): boolean {
  // Se o nome não for o mesmo, já retorna falso
  if (exercise1.name.toLowerCase() !== exercise2.name.toLowerCase()) {
    return false;
  }

  // Se o número de séries é diferente, não são similares
  if ((exercise1.sets?.length || 0) !== (exercise2.sets?.length || 0)) {
    return false;
  }

  // Se não tem séries, não tem como comparar detalhes
  if (!exercise1.sets || !exercise2.sets || exercise1.sets.length === 0) {
    return true;
  }

  // Compara os pesos e repetições
  const similarSets = exercise1.sets.every((set1, index) => {
    const set2 = exercise2.sets?.[index];
    if (!set2) return false;

    // Considera similar se peso e reps são idênticos
    return set1.weight === set2.weight && set1.reps === set2.reps;
  });

  return similarSets;
}

/**
 * Determina se houve progresso entre dois treinos
 */
function hasProgressedBetween(newer: Exercise, older: Exercise): boolean {
  if (
    !newer.sets ||
    !older.sets ||
    newer.sets.length === 0 ||
    older.sets.length === 0
  ) {
    return false;
  }

  // Verifica se houve aumento de peso ou repetições em pelo menos uma série
  let hasAnyProgress = false;

  // Calcular volume total para comparação
  const calculateTotalVolume = (sets: ExerciseSet[]) =>
    sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  const newerVolume = calculateTotalVolume(newer.sets);
  const olderVolume = calculateTotalVolume(older.sets);

  // Verificar progresso por série
  for (let i = 0; i < Math.min(newer.sets.length, older.sets.length); i++) {
    const newSet = newer.sets[i];
    const oldSet = older.sets[i];

    // Consideramos um aumento significativo de peso ou repetições como progresso
    if (newSet.weight > oldSet.weight || newSet.reps > oldSet.reps) {
      // Verificar se o aumento não é irrelevante (ex: 0.5kg em um peso grande)
      // Para pesos pequenos (≤10kg), qualquer aumento é significativo
      const isSignificantWeightIncrease =
        newSet.weight > oldSet.weight &&
        (newSet.weight <= 10 ||
          (newSet.weight - oldSet.weight) / oldSet.weight >= 0.02); // 2% para pesos maiores

      if (isSignificantWeightIncrease || newSet.reps > oldSet.reps) {
        hasAnyProgress = true;
        break;
      }
    }
  }

  // Considerar também o volume total
  // Um aumento de pelo menos 5% no volume total também é considerado progresso
  const volumeIncreasePercent = (newerVolume - olderVolume) / olderVolume;
  if (volumeIncreasePercent >= 0.05) {
    // 5% de aumento no volume
    hasAnyProgress = true;
  }

  // Aumento no número de séries também indica progresso
  if (newer.sets.length > older.sets.length) {
    hasAnyProgress = true;
  }

  // Se houver progresso, registrar para depuração
  if (hasAnyProgress) {
  }

  return hasAnyProgress;
}

/**
 * Analisa múltiplos treinos anteriores para detectar padrões
 * Retorna informações sobre platô, progressão, etc.
 */
function analyzeExerciseHistory(history: ExerciseHistory): {
  isInPlateau: boolean;
  plateauDuration: number;
  hasRecentProgress: boolean;
  lastProgressDate: string | null;
  shouldAddSet: boolean;
  shouldIncreaseTempo: boolean;
  shouldDecreaseRest: boolean;
  shouldIncreaseWeight: boolean;
  shouldIncreaseReps: boolean;
  currentSets: number;
  repeatedWorkouts: number;
  avgIntensity: number;
  maxReps: number;
  plateauType: "none" | "repetition" | "weight" | "volume" | "intensity";
} {
  // Se não houver histórico suficiente, não podemos fazer análise
  if (history.exercises.length <= 1) {
    return {
      isInPlateau: false,
      plateauDuration: 0,
      hasRecentProgress: false,
      lastProgressDate: null,
      shouldAddSet: false,
      shouldIncreaseTempo: false,
      shouldDecreaseRest: false,
      shouldIncreaseWeight: false,
      shouldIncreaseReps: false,
      currentSets: history.exercises[0]?.sets?.length || 0,
      repeatedWorkouts: 0,
      avgIntensity: 0,
      maxReps: 0,
      plateauType: "none",
    };
  }

  // Ordenar exercícios por data (do mais recente para o mais antigo)
  const orderedExercises = [...history.exercises];
  const orderedDates = [...history.dates];

  // Inicializar variáveis de análise
  let isInPlateau = false;
  let plateauStartIndex = -1;
  let hasRecentProgress = false;
  let lastProgressIndex = -1;
  let repeatedWorkouts = 0;
  let plateauType: "none" | "repetition" | "weight" | "volume" | "intensity" =
    "none";

  // Primeiro passo: identificar o último progresso
  for (let i = 0; i < orderedExercises.length - 1; i++) {
    const current = orderedExercises[i];
    const previous = orderedExercises[i + 1];

    // Verificar se houve progresso entre esses treinos
    if (hasProgressedBetween(current, previous)) {
      hasRecentProgress = true;
      lastProgressIndex = i;

      // Encontramos o progresso mais recente, não precisamos verificar mais
      break;
    }
  }

  // Segundo passo: analisar o platô APENAS a partir do último progresso
  // Se não houve progresso recente, analisamos todo o histórico
  const startIndex = lastProgressIndex === -1 ? 0 : 0;
  const endIndex =
    lastProgressIndex === -1 ? orderedExercises.length - 1 : lastProgressIndex;

  // Resetar contagem de repetições para considerar apenas treinos relevantes
  repeatedWorkouts = 0;

  // Analisar apenas os treinos após o último progresso (ou todos, se não houve progresso)
  for (let i = startIndex; i < endIndex; i++) {
    const current = orderedExercises[i];
    const next = orderedExercises[i + 1];

    if (!next) break;

    // Verificar se há repetição de treino
    if (areWorkoutsSimilar(current, next)) {
      repeatedWorkouts++;

      // Marcar o início do platô (primeiro par de treinos repetidos)
      if (plateauStartIndex === -1) {
        plateauStartIndex = i;
      }
    }
  }

  // Reduzido para apenas 2 treinos repetidos para detectar platô
  isInPlateau = plateauStartIndex !== -1 && repeatedWorkouts >= 1; // 1 repetição = 2 treinos iguais

  // Definir o tipo de platô com base nas características dos treinos
  if (isInPlateau) {
    const recentExercises = orderedExercises.slice(
      0,
      lastProgressIndex === -1 ? orderedExercises.length : lastProgressIndex + 1
    );

    // Vamos analisar características específicas para identificar o tipo de platô
    const firstExercise = recentExercises[0];

    if (!firstExercise.sets || firstExercise.sets.length === 0) {
      plateauType = "none";
    } else {
      // Obter características médias dos exercícios recentes
      const intensities = recentExercises
        .filter((ex) => ex.sets && ex.sets.length > 0)
        .map((ex) => average(ex.sets!.map((set) => evaluateIntensity(set))));

      const avgIntensity = average(intensities);

      // Verificar o tipo de platô com base nas características
      const maxReps = Math.max(...firstExercise.sets.map((set) => set.reps));

      if (maxReps >= 12) {
        plateauType = "weight"; // Atingiu teto de repetições, precisa aumentar peso
      } else if (avgIntensity <= 4) {
        plateauType = "intensity"; // Intensidade baixa, precisa aumentar esforço
      } else if (firstExercise.sets.length < 3) {
        plateauType = "volume"; // Poucas séries, pode adicionar mais volume
      } else {
        plateauType = "repetition"; // Platô padrão, provavelmente precisa variar algo
      }
    }
  }

  // Obter número atual de séries e estatísticas
  const currentSets = orderedExercises[0]?.sets?.length || 0;

  // Calcular intensidade média e repetições máximas para o exercício atual
  let avgIntensity = 0;
  let maxReps = 0;

  if (orderedExercises[0]?.sets) {
    const sets = orderedExercises[0].sets;
    avgIntensity = average(sets.map((set) => evaluateIntensity(set)));
    maxReps = Math.max(...sets.map((set) => set.reps));
  }

  // Determinar diferentes estratégias de quebra de platô
  const shouldAddSet =
    isInPlateau &&
    currentSets < 4 &&
    (plateauType === "volume" ||
      (plateauType === "repetition" && currentSets < 3));

  const shouldIncreaseTempo =
    isInPlateau &&
    (plateauType === "intensity" ||
      (plateauType === "repetition" && avgIntensity < 6));

  const shouldDecreaseRest =
    isInPlateau && plateauType === "intensity" && avgIntensity < 5;

  const shouldIncreaseWeight =
    isInPlateau &&
    (plateauType === "weight" || (maxReps >= 10 && repeatedWorkouts >= 2));

  const shouldIncreaseReps =
    isInPlateau && plateauType === "repetition" && maxReps < 10;

  // Calcular a duração do platô
  const plateauDuration = plateauStartIndex === -1 ? 0 : plateauStartIndex + 1;

  // Obter a data do último progresso
  const lastProgressDate =
    lastProgressIndex === -1 ? null : orderedDates[lastProgressIndex];

  return {
    isInPlateau,
    plateauDuration,
    hasRecentProgress,
    lastProgressDate,
    shouldAddSet,
    shouldIncreaseTempo,
    shouldDecreaseRest,
    shouldIncreaseWeight,
    shouldIncreaseReps,
    currentSets,
    repeatedWorkouts,
    avgIntensity,
    maxReps,
    plateauType,
  };
}

/**
 * Gera sugestões de progressão para um exercício específico com base no histórico
 */
export function generateExerciseProgressionWithHistory(
  exercise: Exercise,
  exerciseInfo: ExerciseData | undefined,
  history: ExerciseHistory
): ProgressionSuggestion | null {
  // Verificar se é um exercício de cardio ou não possui séries
  if (
    exercise.category === "cardio" ||
    !exercise.sets ||
    exercise.sets.length === 0
  ) {
    return null;
  }

  // Obter informações do exercício do banco de dados
  const exerciseData = exerciseInfo || findExerciseData(exercise);

  // Definir incremento padrão caso não tenha informações específicas
  let weightIncrement = exerciseData?.weightIncrement || 2.5;

  // Copiar as séries anteriores para referência
  const previousSets = [...exercise.sets];

  // Inicializar as séries sugeridas como cópia das anteriores
  const suggestedSets: ExerciseSet[] = previousSets.map((set) => ({
    ...set,
    id: `progset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  }));

  // Determinar tipo de progressão com base no exercício e nas séries
  let progressionType:
    | "weight"
    | "reps"
    | "rest"
    | "volume"
    | "technique"
    | "combined"
    | "deload"
    | "sets" = "reps";
  let reasonForSuggestion = "";
  let difficultyLevel: "easy" | "moderate" | "challenging" = "moderate";

  // Analisar as séries para determinar o melhor tipo de progressão
  const avgReps = average(previousSets.map((set) => set.reps));
  const avgWeight = average(previousSets.map((set) => set.weight));
  const maxReps = Math.max(...previousSets.map((set) => set.reps));

  // Obter dados específicos de intensidade
  const avgIntensity = average(
    previousSets.map((set) => evaluateIntensity(set))
  );
  const avgRIR = getAvgRIR(previousSets);
  const avgPerceivedEffort = getAvgPerceivedEffort(previousSets);
  const anyToFailure = previousSets.some((set) => set.toFailure);

  // Analisar o histórico do exercício
  const historyAnalysis = analyzeExerciseHistory(history);

  // Verificar se o exercício usa halteres e ajustar o incremento com base no peso atual
  if (exerciseData?.equipment === "Halteres") {
    suggestedSets.forEach((set) => {
      // Para halteres abaixo de 10kg, incremento de 1kg
      if (set.weight <= 10) {
        weightIncrement = 1;
      } else {
        // Para halteres acima de 10kg, incremento de 2kg
        weightIncrement = 2;
      }
    });
  }

  // MATRIZ DE QUEBRA DE PLATÔ - DECISÃO INTELIGENTE COM BASE NO TIPO DE PLATÔ

  if (historyAnalysis.isInPlateau) {
    // CASO 1: Platô com repetições altas - Aumentar o peso
    if (historyAnalysis.shouldIncreaseWeight) {
      progressionType = "weight";

      if (historyAnalysis.maxReps >= 12) {
        reasonForSuggestion = getTranslation(
          "progression.algorithm.plateau.highReps"
        );
      } else {
        reasonForSuggestion = getTranslation(
          "progression.algorithm.plateau.notHighReps"
        );
      }

      suggestedSets.forEach((set, index) => {
        // Aplicar o incremento padrão
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Reduzir as repetições para compensar o novo peso
        const originalReps = previousSets[index].reps;
        if (originalReps >= 10) {
          set.reps = Math.max(6, originalReps - 4); // Reduzir em 4, mas manter ao menos 6
        } else {
          set.reps = Math.max(5, originalReps - 2); // Reduzir menos para pesos já desafiadores
        }

        // Ajustar o tempo de descanso (máximo de 3 minutos)
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.min(MAX_REST_TIME, previousRest + 15);

        // Última série deve ser levada à falha para garantir estímulo máximo
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "challenging";
    }

    // CASO 2: Platô com poucas séries - Adicionar uma série
    else if (historyAnalysis.shouldAddSet) {
      progressionType = "sets";

      if (historyAnalysis.repeatedWorkouts >= 2) {
        reasonForSuggestion = getTranslation(
          "progression.algorithm.plateau.repeatedWorkouts"
        );
      } else {
        reasonForSuggestion = getTranslation(
          "progression.algorithm.plateau.needMoreVolume"
        );
      }

      // Número máximo de séries é 4
      if (historyAnalysis.currentSets < 4) {
        // Ajustar tempos de descanso nas séries existentes para ≤ 3 minutos
        suggestedSets.forEach((set) => {
          const currentRest = set.restTime || 60;
          set.restTime = Math.min(MAX_REST_TIME, currentRest);
        });

        // Adicionar uma nova série baseada na última série
        const lastSet = previousSets[previousSets.length - 1];
        const newSet: ExerciseSet = {
          id: `progset-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          reps: lastSet.reps,
          weight: lastSet.weight,
          restTime: Math.min(MAX_REST_TIME, lastSet.restTime || 60),
          repsInReserve: 0, // Última série com RIR 0
          perceivedEffort: 5, // Percepção máxima
          toFailure: true, // Nova série deve ser até a falha
        };

        // Adicionar a nova série às séries sugeridas
        suggestedSets.push(newSet);

        difficultyLevel = "challenging";
      }
    }

    // CASO 3: Intensidade baixa - Reduzir descanso e aumentar intensidade
    else if (historyAnalysis.shouldDecreaseRest) {
      progressionType = "rest";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.plateau.lowIntensity"
      );

      suggestedSets.forEach((set, index) => {
        // Reduzir tempo de descanso para aumentar intensidade
        const previousRest = previousSets[index].restTime || 60;
        // Reduzir em 15s, mínimo de 30s
        set.restTime = Math.max(MIN_REST_TIME, previousRest - 15);

        // Marcar a última série como "até a falha" para aumentar intensidade
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) {
            set.repsInReserve = 0;
          }
          if (set.perceivedEffort !== undefined) {
            set.perceivedEffort = 5;
          }
        }
      });

      difficultyLevel = "challenging";
    }

    // CASO 4: Platô com baixas repetições - Aumentar repetições
    else if (historyAnalysis.shouldIncreaseReps) {
      progressionType = "reps";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.plateau.lowReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aumentar repetições gradualmente, mas sem ultrapassar o máximo
        set.reps = Math.min(MAX_REPS, previousSets[index].reps + 2);

        // Garantir que o descanso não ultrapasse 3 minutos
        if (set.restTime) {
          set.restTime = Math.min(MAX_REST_TIME, set.restTime);
        }

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "moderate";
    }

    // CASO 5: Platô de intensidade - Aumentar o ritmo/controlar tempo
    else if (historyAnalysis.shouldIncreaseTempo) {
      progressionType = "technique";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.plateau.needBetterTechnique"
      );

      suggestedSets.forEach((set, index) => {
        // Mantém mesmo peso e reps, mas ajusta parâmetros de intensidade
        if (set.repsInReserve !== undefined) {
          set.repsInReserve = Math.max(0, set.repsInReserve - 1);
        }
        if (set.perceivedEffort !== undefined) {
          set.perceivedEffort = Math.min(5, set.perceivedEffort + 1);
        }

        // Ajustar tempo de descanso sem ultrapassar o limite máximo
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.min(
          MAX_REST_TIME,
          Math.max(MIN_REST_TIME, previousRest - 10)
        );

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "moderate";
    }

    // CASO PADRÃO: Progressão combinada leve
    else {
      progressionType = "combined";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.plateau.combined"
      );

      suggestedSets.forEach((set, index) => {
        // Pequeno ajuste no peso (meio incremento)
        const halfIncrement = weightIncrement / 2;
        set.weight = Math.round((set.weight + halfIncrement) * 2) / 2;

        // Pequeno ajuste nas repetições sem ultrapassar máximo
        set.reps = Math.min(MAX_REPS, previousSets[index].reps + 1);

        // Garantir que o descanso não ultrapasse o limite
        if (set.restTime) {
          set.restTime = Math.min(MAX_REST_TIME, set.restTime);
        }

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "moderate";
    }

    // Se chegamos até aqui com uma progressão de platô, retornamos a sugestão
    if (progressionType) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        previousSets,
        suggestedSets,
        progressionType,
        reasonForSuggestion,
        difficultyLevel,
      };
    }
  }

  // ============ MATRIZ DE DECISÃO PARA DIFERENTES CENÁRIOS ============
  // (Código original para quando não está em platô)

  // CENÁRIO 1: Treino até a falha ou com RIR muito baixo (0-1)
  if (anyToFailure || avgRIR <= 1) {
    if (maxReps >= 12) {
      // Atingiu 12+ reps com falha/RIR baixo: aumentar peso com cautela
      progressionType = "weight";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.highRepsWithFailure"
      );

      suggestedSets.forEach((set, index) => {
        // Aplicar o incremento padrão
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Reduzir as repetições para compensar o novo peso
        const originalReps = previousSets[index].reps;
        if (originalReps >= 12) {
          set.reps = 6; // Reiniciar com 6 repetições
        } else {
          set.reps = originalReps;
        }

        // Aumentar o tempo de descanso para melhor recuperação mas respeitando máximo
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.min(MAX_REST_TIME, previousRest + 30);

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "challenging";
    } else {
      // Não atingiu 12 reps, mas treinou muito intenso: pequeno aumento nas reps
      progressionType = "reps";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.highIntensity"
      );

      suggestedSets.forEach((set, index) => {
        // Pequeno aumento nas repetições (apenas +1 devido à alta intensidade)
        set.reps = Math.min(MAX_REPS, previousSets[index].reps + 1);

        // Ajustar tempo de descanso respeitando o máximo
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.min(MAX_REST_TIME, previousRest + 15);

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "moderate";
    }
  }

  // CENÁRIO 2: RIR médio (2) com esforço percebido médio a alto (3-4)
  else if (avgRIR === 2 && avgPerceivedEffort >= 3 && avgPerceivedEffort <= 4) {
    if (maxReps >= 12) {
      // Atingiu 12+ reps com intensidade moderada: aumentar peso
      progressionType = "weight";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.goodReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aplicar o incremento padrão
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Quando atingir 12 repetições, reduzir para 6-8 repetições
        const originalReps = previousSets[index].reps;
        if (originalReps >= 12) {
          set.reps = 6;
        } else {
          set.reps = originalReps;
        }

        // Ajustar tempo de descanso respeitando limite
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.min(MAX_REST_TIME, previousRest + 15);

        // Última série até a falha
        if (index === suggestedSets.length - 1) {
          set.toFailure = true;
          if (set.repsInReserve !== undefined) set.repsInReserve = 0;
        }
      });

      difficultyLevel = "moderate";
    } else if (avgReps >= 8 && avgReps < 12) {
      // Entre 8-11 reps com intensidade moderada: aumento combinado
      progressionType = "combined";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.nearTargetReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aumentar levemente o peso (meio incremento)
        const halfIncrement = weightIncrement / 2;
        // Arredondar para 0.5kg mais próximo para manter viável
        set.weight = Math.round((set.weight + halfIncrement) * 2) / 2;

        // Manter as mesmas repetições para adaptar ao novo peso
        set.reps = previousSets[index].reps;
      });

      difficultyLevel = "moderate";
    } else {
      // Menos de 8 reps com intensidade moderada: focar em reps
      progressionType = "reps";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.continueReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aumento moderado de repetições (+2)
        set.reps = previousSets[index].reps + 2;
      });

      difficultyLevel = "moderate";
    }
  }

  // CENÁRIO 3: RIR alto (3-5) com esforço percebido baixo (1-2)
  else if (avgRIR >= 3 && avgPerceivedEffort <= 2) {
    // Treino muito leve: aumento agressivo independente das repetições
    if (maxReps >= 10) {
      // Já tem repetições suficientes com intensidade baixa: aumento direto de peso
      progressionType = "weight";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.weightTooLight"
      );

      suggestedSets.forEach((set, index) => {
        // Aplicar incremento completo
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Manter pelo menos 8 repetições com o novo peso
        set.reps = Math.max(8, previousSets[index].reps - 2);

        // Reduzir tempo de descanso para aumentar intensidade
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.max(45, previousRest - 10);
      });

      difficultyLevel = "challenging";
    } else if (avgReps >= 6 && avgReps < 10) {
      // Entre 6-9 reps com intensidade muito baixa: aumento combinado mais agressivo
      progressionType = "combined";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.weightTooLightKeepReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aplicar incremento completo
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Manter as mesmas repetições - o usuário provavelmente conseguirá com o novo peso
        set.reps = previousSets[index].reps;

        // Reduzir descanso para aumentar intensidade
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.max(45, previousRest - 10);
      });

      difficultyLevel = "challenging";
    } else {
      // Menos de 6 reps com intensidade muito baixa: aumento grande nas reps
      progressionType = "reps";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.veryLowIntensity"
      );

      suggestedSets.forEach((set, index) => {
        // Aumento agressivo de repetições (+3 ou +4 dependendo do ponto de partida)
        const currentReps = previousSets[index].reps;
        if (currentReps <= 3) {
          set.reps = currentReps + 4; // Aumento muito grande para reps muito baixas
        } else {
          set.reps = currentReps + 3;
        }

        // Reduzir descanso para aumentar intensidade
        const previousRest = previousSets[index].restTime || 60;
        set.restTime = Math.max(45, previousRest - 15);
      });

      difficultyLevel = "challenging";
    }
  }

  // CENÁRIO 4: RIR médio-alto (3-4) com esforço percebido médio (3)
  else if (avgRIR >= 3 && avgRIR <= 4 && avgPerceivedEffort === 3) {
    if (maxReps >= 12) {
      // Atingiu 12+ reps com intensidade média: aumento normal de peso
      progressionType = "weight";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.targetReached"
      );

      suggestedSets.forEach((set, index) => {
        // Aplicar incremento padrão
        set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

        // Reduzir para 6-8 repetições
        const originalReps = previousSets[index].reps;
        if (originalReps >= 12) {
          set.reps = 6;
        } else {
          set.reps = originalReps;
        }
      });

      difficultyLevel = "moderate";
    } else if (avgReps >= 8 && avgReps < 12) {
      // Entre 8-11 reps com intensidade média: aumento de repetições com potencial para peso
      progressionType = "combined";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.closeToTarget"
      );

      suggestedSets.forEach((set, index) => {
        // Se estiver bem próximo de 12 reps (10-11), pequeno aumento de peso
        if (previousSets[index].reps >= 10) {
          const halfIncrement = weightIncrement / 2;
          set.weight = Math.round((set.weight + halfIncrement) * 2) / 2;
          set.reps = previousSets[index].reps; // Manter reps
        } else {
          // Caso contrário, aumentar 2 repetições
          set.reps = previousSets[index].reps + 2;
        }
      });

      difficultyLevel = "moderate";
    } else {
      // Menos de 8 reps com intensidade média: aumento de repetições
      progressionType = "reps";
      reasonForSuggestion = getTranslation(
        "progression.algorithm.scenarios.increaseReps"
      );

      suggestedSets.forEach((set, index) => {
        // Aumento moderado de repetições (+2)
        set.reps = previousSets[index].reps + 2;
      });

      difficultyLevel = "moderate";
    }
  }

  // CENÁRIO 5: Demais casos (cai na matriz normal de intensidade)
  else {
    // Usar a intensidade calculada para determinar a progressão
    if (avgIntensity >= 7) {
      // Intensidade alta
      if (maxReps >= 12) {
        // Atingiu repetições alvo: aumentar peso
        progressionType = "weight";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.goodReps"
        );

        suggestedSets.forEach((set, index) => {
          // Aplicar incremento padrão
          set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

          // Reduzir repetições ao adicionar peso
          const originalReps = previousSets[index].reps;
          if (originalReps >= 12) {
            set.reps = 6;
          } else {
            set.reps = originalReps;
          }

          // Ajustar descanso para maior recuperação
          const previousRest = previousSets[index].restTime || 60;
          set.restTime = Math.min(180, previousRest + 30);
        });

        difficultyLevel = "challenging";
      } else {
        // Não atingiu repetições alvo: focar em reps
        progressionType = "reps";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.continueReps"
        );

        suggestedSets.forEach((set, index) => {
          // Pequeno aumento nas repetições devido à alta intensidade
          set.reps = previousSets[index].reps + 1;

          // Manter tempo de descanso similar
          const previousRest = previousSets[index].restTime || 60;
          set.restTime = previousRest;
        });

        difficultyLevel = "moderate";
      }
    } else if (avgIntensity >= 4 && avgIntensity < 7) {
      // Intensidade moderada
      if (maxReps >= 12) {
        // Atingiu repetições alvo: aumentar peso
        progressionType = "weight";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.targetReached"
        );

        suggestedSets.forEach((set, index) => {
          // Aplicar incremento padrão
          set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

          // Reduzir repetições ao adicionar peso
          const originalReps = previousSets[index].reps;
          if (originalReps >= 12) {
            set.reps = 6;
          } else {
            set.reps = originalReps;
          }
        });

        difficultyLevel = "moderate";
      } else if (avgReps >= 9 && avgReps < 12) {
        // Próximo das repetições alvo: aumento final de repetições
        progressionType = "reps";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.increaseReps"
        );

        suggestedSets.forEach((set, index) => {
          // Aumento de 2 repetições
          set.reps = previousSets[index].reps + 2;
        });

        difficultyLevel = "moderate";
      } else {
        // Longe das repetições alvo: aumento normal de repetições
        progressionType = "reps";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.increaseReps"
        );

        suggestedSets.forEach((set, index) => {
          // Aumento de 2 repetições
          set.reps = previousSets[index].reps + 2;
        });

        difficultyLevel = "moderate";
      }
    } else {
      // Intensidade baixa
      if (maxReps >= 12) {
        // Atingiu repetições alvo: aumentar peso
        progressionType = "weight";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.lowIntensityHighReps"
        );

        suggestedSets.forEach((set, index) => {
          // Aplicar incremento completo
          set.weight = Math.round((set.weight + weightIncrement) * 2) / 2;

          // Reduzir repetições ao adicionar peso
          const originalReps = previousSets[index].reps;
          if (originalReps >= 12) {
            set.reps = 6;
          } else {
            set.reps = originalReps;
          }

          // Reduzir descanso para aumentar intensidade
          const previousRest = previousSets[index].restTime || 60;
          set.restTime = Math.max(45, previousRest - 15);
        });

        difficultyLevel = "challenging";
      } else if (avgReps >= 8 && avgReps < 12) {
        // Próximo das repetições alvo: considerar aumento combinado
        progressionType = "combined";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.lowIntensityNearTarget"
        );

        suggestedSets.forEach((set, index) => {
          // Meio incremento de peso para começar adaptação
          const halfIncrement = weightIncrement / 2;
          set.weight = Math.round((set.weight + halfIncrement) * 2) / 2;

          // Manter repetições para adaptar ao novo peso
          set.reps = previousSets[index].reps;

          // Reduzir descanso para aumentar intensidade
          const previousRest = previousSets[index].restTime || 60;
          set.restTime = Math.max(45, previousRest - 10);
        });

        difficultyLevel = "moderate";
      } else {
        // Longe das repetições alvo: aumento agressivo de repetições
        progressionType = "reps";
        reasonForSuggestion = getTranslation(
          "progression.algorithm.scenarios.lowIntensityLowReps"
        );

        suggestedSets.forEach((set, index) => {
          // Aumento agressivo de 3 repetições, limitado a 12
          set.reps = Math.min(12, previousSets[index].reps + 3);

          // Reduzir descanso para aumentar intensidade
          const previousRest = previousSets[index].restTime || 60;
          set.restTime = Math.max(45, previousRest - 10);
        });

        difficultyLevel = "challenging";
      }
    }
  }

  // AJUSTES ESPECIAIS PARA GRANDES GRUPOS MUSCULARES
  if (
    exerciseData?.muscle.includes("Pernas") ||
    exerciseData?.muscle.includes("Costas") ||
    exerciseData?.muscle.includes("Peito")
  ) {
    // Verificar se há alguém treinando até a falha
    const anyFailureSet = previousSets.some((set) => set.toFailure);

    // Ajustes baseados em RIR e intensidade
    if (anyFailureSet || avgRIR <= 1) {
      // Treinamento até falha ou muito próximo: aumentar descanso (mas respeitando máximo)
      suggestedSets.forEach((set, index) => {
        // Garantir descanso adequado para recuperação
        const previousRest = previousSets[index].restTime || 60;

        // Não sobrescrever ajustes anteriores
        if (set.restTime === previousRest) {
          set.restTime = Math.min(MAX_REST_TIME, previousRest + 30);
        }
      });
    } else if (avgRIR >= 4) {
      // RIR muito alto: reduzir descanso para aumentar intensidade
      suggestedSets.forEach((set, index) => {
        const previousRest = previousSets[index].restTime || 60;

        // Não sobrescrever ajustes anteriores
        if (set.restTime === previousRest) {
          set.restTime = Math.max(MIN_REST_TIME, previousRest - 15);
        }
      });
    }
  }

  // AJUSTE FINAL: garantir que a última série seja sempre até a falha
  if (suggestedSets.length > 0) {
    const lastSetIndex = suggestedSets.length - 1;
    suggestedSets[lastSetIndex].toFailure = true;
    if (suggestedSets[lastSetIndex].repsInReserve !== undefined) {
      suggestedSets[lastSetIndex].repsInReserve = 0;
    }
    if (suggestedSets[lastSetIndex].perceivedEffort !== undefined) {
      suggestedSets[lastSetIndex].perceivedEffort = 5;
    }
  }

  // VALIDAÇÃO FINAL: garantir que nenhum descanso ultrapasse o máximo permitido
  suggestedSets.forEach((set) => {
    if (set.restTime) {
      set.restTime = Math.min(MAX_REST_TIME, set.restTime);
    }

    // Garantir também que as repetições não ultrapassem o máximo
    set.reps = Math.min(MAX_REPS, set.reps);
  });

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    previousSets,
    suggestedSets,
    progressionType,
    reasonForSuggestion,
    difficultyLevel,
  };
}

/**
 * Agrupa exercícios por nome para analisar histórico
 */
function groupExercisesByName(
  workoutsHistory: { exercises: Exercise[]; date: string }[]
): ExerciseHistory[] {
  const exerciseGroups: Record<string, ExerciseHistory> = {};

  // Agrupar exercícios pelo nome
  // IMPORTANTE: Processamos o histórico em ordem cronológica inversa (do mais recente ao mais antigo)
  // para garantir que a ordem dos treinos seja preservada na análise
  for (let i = 0; i < workoutsHistory.length; i++) {
    const { exercises, date } = workoutsHistory[i];

    exercises.forEach((exercise) => {
      const exerciseName = exercise.name.toLowerCase();

      if (!exerciseGroups[exerciseName]) {
        exerciseGroups[exerciseName] = {
          exerciseName: exercise.name,
          dates: [],
          exercises: [],
        };
      }

      // Adicionar na ordem correta (do mais recente para o mais antigo)
      exerciseGroups[exerciseName].dates.push(date);
      exerciseGroups[exerciseName].exercises.push(exercise);
    });
  }

  return Object.values(exerciseGroups);
}

/**
 * Gera sugestões de progressão para todos os exercícios de um treino
 * Utilizando múltiplos treinos anteriores para análise
 */
export function generateWorkoutProgressionWithHistory(
  currentExercises: Exercise[],
  workoutsHistory: { exercises: Exercise[]; date: string }[]
): ProgressionSuggestion[] {
  const suggestions: ProgressionSuggestion[] = [];

  // Verificar se os treinos históricos já estão em ordem cronológica inversa (do mais recente ao mais antigo)
  // Se não estiverem, ordená-los
  const sortedWorkoutsHistory = [...workoutsHistory].sort((a, b) => {
    // Considerar 'atual' como mais recente
    if (a.date === "atual") return -1;
    if (b.date === "atual") return 1;
    // Caso contrário, ordenar por data (decrescente)
    return b.date.localeCompare(a.date);
  });

  // Agrupar histórico de exercícios por nome
  const exerciseHistories = groupExercisesByName(sortedWorkoutsHistory);

  // Para cada exercício atual
  for (const exercise of currentExercises) {
    // Ignorar exercícios de cardio
    if (exercise.category === "cardio") continue;

    // Encontrar informações do exercício no banco de dados
    const exerciseData = findExerciseData(exercise);

    // Encontrar histórico correspondente para este exercício (por nome)
    const exerciseHistory = exerciseHistories.find(
      (history) =>
        history.exerciseName.toLowerCase() === exercise.name.toLowerCase()
    ) || {
      exerciseName: exercise.name,
      dates: [],
      exercises: [],
    };

    // Adicionar o exercício atual ao histórico se ainda não estiver lá
    if (
      exerciseHistory.exercises.findIndex((e) => e.id === exercise.id) === -1
    ) {
      exerciseHistory.exercises.unshift(exercise);
      exerciseHistory.dates.unshift("atual");
    }

    // Gerar sugestão usando o histórico
    const suggestion = generateExerciseProgressionWithHistory(
      exercise,
      exerciseData,
      exerciseHistory
    );

    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

/**
 * Função de compatibilidade para manter a API original
 */
export function generateWorkoutProgression(
  exercises: Exercise[]
): ProgressionSuggestion[] {
  // Criar um histórico simulado só com o treino atual
  const workoutsHistory = [{ exercises, date: "atual" }];

  // Chamar a nova função com esse histórico
  return generateWorkoutProgressionWithHistory(exercises, workoutsHistory);
}

// Função utilitária para calcular média
function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
