// Tipo para o ícone do treino
export type WorkoutIconType = {
  type: "ionicons" | "material" | "fontawesome";
  name: string;
};

// Tipo para um set de exercício
export interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

// Tipo para um exercício
export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  restTime?: number;
  isCardio?: boolean;
  duration?: number;
  intensity?: number;
}

// Tipo para um treino
export interface Workout {
  id: string;
  name: string;
  iconType: WorkoutIconType;
  color: string;
  exercises: Exercise[];
}

// Tipo para o contexto de treino
export interface WorkoutContextType {
  workouts: { [date: string]: { [workoutId: string]: Exercise[] } };
  getWorkoutForDate: (date: string) => Workout | null;
  getExercisesForWorkout: (workoutId: string, date: string) => Exercise[];
  addExerciseToWorkout: (workoutId: string, exercise: Exercise) => void;
  removeExerciseFromWorkout: (
    workoutId: string,
    exerciseId: string
  ) => Promise<void>;
  saveWorkouts: () => Promise<void>;
}

// Tipo para estatísticas de treino
export interface WorkoutStats {
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
  totalDuration: number;
  avgWeight: number;
  maxWeight: number;
  avgReps: number;
  totalReps: number;
  caloriesBurned: number;
}
