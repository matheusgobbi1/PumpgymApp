import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from "react-native";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
// Importar o tipo para os ícones do Ionicons
import type { Icon } from "@expo/vector-icons/build/createIconSet";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Swipeable } from "react-native-gesture-handler";
import { Animated as RNAnimated } from "react-native"; // Para as animações básicas
import Animated, { FadeIn, Easing } from "react-native-reanimated"; // Manter para outros efeitos
import { useTheme } from "../../context/ThemeContext"; // Atualizado para usar ThemeContext consistente
import { useWorkoutContext, Exercise } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import ButtonNew from "../common/ButtonNew";
import { v4 as uuidv4 } from "uuid";

// Tipo para os ícones do Ionicons
type IoniconsNames = React.ComponentProps<typeof Ionicons>["name"];
// Tipo para os ícones do MaterialCommunityIcons
type MaterialIconNames = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];
// Tipo para os ícones do FontAwesome5
type FontAwesome5Names = React.ComponentProps<typeof FontAwesome5>["name"];

// Tipo para os ícones de treino (união de todos os tipos de ícones)
type WorkoutIconType = {
  type: "ionicons" | "material" | "fontawesome";
  name: IoniconsNames | MaterialIconNames | FontAwesome5Names;
};

// Definição dos tipos de treinos padrão com ícones melhorados
const DEFAULT_WORKOUT_TYPES: WorkoutType[] = [
  {
    id: "chest",
    name: "Peito",
    iconType: {
      type: "material" as const,
      name: "weight-lifter" as MaterialIconNames,
    },
    color: "#FF5252",
    selected: false,
    isDefault: true,
  },
  {
    id: "back",
    name: "Costas",
    iconType: {
      type: "material" as const,
      name: "human-handsdown" as MaterialIconNames,
    },
    color: "#448AFF",
    selected: false,
    isDefault: true,
  },
  {
    id: "legs",
    name: "Pernas",
    iconType: {
      type: "material" as const,
      name: "run-fast" as MaterialIconNames,
    },
    color: "#66BB6A",
    selected: false,
    isDefault: true,
  },
  {
    id: "shoulders",
    name: "Ombros",
    iconType: {
      type: "material" as const,
      name: "arm-flex" as MaterialIconNames,
    },
    color: "#FFA726",
    selected: false,
    isDefault: true,
  },
  {
    id: "arms",
    name: "Braços",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#AB47BC",
    selected: false,
    isDefault: true,
  },
  {
    id: "abs",
    name: "Abdômen",
    iconType: {
      type: "ionicons" as const,
      name: "body-outline" as IoniconsNames,
    },
    color: "#26C6DA",
    selected: false,
    isDefault: true,
  },
  {
    id: "cardio",
    name: "Cardio",
    iconType: {
      type: "ionicons" as const,
      name: "heart-outline" as IoniconsNames,
    },
    color: "#EF5350",
    selected: false,
    isDefault: true,
  },
  {
    id: "fullbody",
    name: "Full Body",
    iconType: {
      type: "material" as const,
      name: "dumbbell" as MaterialIconNames,
    },
    color: "#7E57C2",
    selected: false,
    isDefault: true,
  },
];

// Ícones disponíveis para treinos personalizados
const AVAILABLE_ICONS: WorkoutIconType[] = [
  // Ícones do MaterialCommunityIcons
  { type: "material" as const, name: "dumbbell" as MaterialIconNames },
  { type: "material" as const, name: "weight-lifter" as MaterialIconNames },
  { type: "material" as const, name: "human-handsdown" as MaterialIconNames },
  { type: "material" as const, name: "run-fast" as MaterialIconNames },
  { type: "material" as const, name: "arm-flex" as MaterialIconNames },
  { type: "material" as const, name: "arm-flex-outline" as MaterialIconNames },
  { type: "material" as const, name: "human-male" as MaterialIconNames },
  { type: "material" as const, name: "weight" as MaterialIconNames },
  { type: "material" as const, name: "yoga" as MaterialIconNames },
  { type: "material" as const, name: "bike" as MaterialIconNames },

  // Ícones do FontAwesome5
  { type: "fontawesome" as const, name: "dumbbell" as FontAwesome5Names },
  { type: "fontawesome" as const, name: "running" as FontAwesome5Names },
  { type: "fontawesome" as const, name: "walking" as FontAwesome5Names },
  { type: "fontawesome" as const, name: "heartbeat" as FontAwesome5Names },
  { type: "fontawesome" as const, name: "biking" as FontAwesome5Names },
  { type: "fontawesome" as const, name: "swimmer" as FontAwesome5Names },

  // Ícones do Ionicons
  { type: "ionicons" as const, name: "barbell-outline" as IoniconsNames },
  { type: "ionicons" as const, name: "body-outline" as IoniconsNames },
  { type: "ionicons" as const, name: "fitness-outline" as IoniconsNames },
  { type: "ionicons" as const, name: "bicycle-outline" as IoniconsNames },
  { type: "ionicons" as const, name: "walk-outline" as IoniconsNames },
  { type: "ionicons" as const, name: "heart-outline" as IoniconsNames },
];

// Interface para o tipo de treino
export interface WorkoutType {
  id: string;
  name: string;
  iconType: WorkoutIconType;
  color: string;
  selected: boolean;
  isDefault?: boolean;
}

// Interface para o dia da semana
interface WeekDay {
  id: number; // 0 = domingo, 1 = segunda, ..., 6 = sábado
  name: string;
  shortName: string;
  expanded: boolean;
  workout: WorkoutType | null;
}

// Interface para as props do componente
interface WorkoutConfigSheetProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  selectedDate?: Date; // Data selecionada (opcional)
}

// Componente para renderizar o ícone correto com base no tipo
const WorkoutIcon = ({
  iconType,
  size,
  color,
}: {
  iconType: WorkoutIconType;
  size: number;
  color: string;
}) => {
  // Verificação de segurança para evitar erros quando iconType for undefined
  if (!iconType) {
    // Renderizar um ícone padrão como fallback
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  // Verificar se o tipo e o nome são válidos
  if (!iconType.type || !iconType.name) {
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  if (iconType.type === "material") {
    return (
      <MaterialCommunityIcons
        name={iconType.name as MaterialIconNames}
        size={size}
        color={color}
      />
    );
  } else if (iconType.type === "fontawesome") {
    return (
      <FontAwesome5
        name={iconType.name as FontAwesome5Names}
        size={size}
        color={color}
      />
    );
  } else {
    return (
      <Ionicons
        name={iconType.name as IoniconsNames}
        size={size}
        color={color}
      />
    );
  }
};

// Componente para renderizar um item de treino de forma memoizada
const WorkoutItem = React.memo(
  ({
    workout,
    dayId,
    onToggleSelection,
    onRenderRightActions,
    colors,
  }: {
    workout: WorkoutType;
    dayId: number;
    onToggleSelection: (dayId: number, workoutId: string) => void;
    onRenderRightActions: (id: string, isDefault?: boolean) => React.ReactNode;
    colors: any;
  }) => {

    // Verificar se o iconType está definido corretamente
    if (!workout.iconType) {

      // Procurar o tipo padrão correspondente para obter o iconType correto
      const defaultType = DEFAULT_WORKOUT_TYPES.find(
        (type) => type.id === workout.id
      );
      if (defaultType && defaultType.iconType) {
        workout.iconType = { ...defaultType.iconType };
      } else {
        // Definir um iconType padrão se não encontrar
        workout.iconType = {
          type: "ionicons" as const,
          name: "barbell-outline" as IoniconsNames,
        };
      }
    }

    return (
      <Swipeable
        renderRightActions={() =>
          onRenderRightActions(workout.id, workout.isDefault)
        }
        friction={2}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[
            styles.workoutItem,
            { backgroundColor: colors.card },
            workout.selected && {
              backgroundColor: workout.color + '08',
              borderWidth: 1,
              borderColor: workout.color + '30'
            },
          ]}
          onPress={() => onToggleSelection(dayId, workout.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.workoutContent,
            workout.selected && { backgroundColor: 'transparent' }
          ]}>
            <View
              style={[
                styles.workoutIconContainer,
                {
                  backgroundColor: workout.selected
                    ? workout.color + "20"
                    : "rgba(255, 255, 255, 0.2)",
                },
              ]}
            >
              <WorkoutIcon
                iconType={workout.iconType}
                size={24}
                color={workout.selected ? workout.color : colors.primary}
              />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutName, { color: colors.text }]}>
                {workout.name}
              </Text>
            </View>
            <View style={styles.workoutSelection}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: workout.selected ? workout.color : colors.border,
                    backgroundColor: workout.selected ? workout.color : 'transparent',
                  },
                ]}
              >
                {workout.selected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }
);

// Componente para renderizar um dia da semana de forma memoizada
const DayCard = React.memo(
  ({
    day,
    onToggleExpansion,
    onSelectAllWorkouts,
    onToggleWorkoutSelection,
    onRenderRightActions,
    colors,
    forceUpdateKey,
  }: {
    day: WeekDay;
    onToggleExpansion: (dayId: number) => void;
    onSelectAllWorkouts: (dayId: number) => void;
    onToggleWorkoutSelection: (dayId: number, workoutId: string) => void;
    onRenderRightActions: (id: string, isDefault?: boolean) => React.ReactNode;
    colors: any;
    forceUpdateKey?: number;
  }) => {
    return (
      <View
        style={[
          styles.dayCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Cabeçalho do dia */}
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => onToggleExpansion(day.id)}
          activeOpacity={0.7}
        >
          <View style={styles.dayInfo}>
            <Text style={[styles.dayName, { color: colors.text }]}>
              {day.name}
            </Text>
            <Text style={[styles.daySubtitle, { color: colors.text + "70" }]}>
              {day.workout
                ? day.workout.name
                : "Nenhum treino configurado"}
            </Text>
          </View>
          <View style={styles.dayActions}>
            <TouchableOpacity
              style={[
                styles.selectAllDayButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={() => onSelectAllWorkouts(day.id)}
            >
              <Text
                style={[styles.selectAllDayText, { color: colors.primary }]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <Ionicons
              name={day.expanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.text}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {/* Lista de treinos para o dia */}
        {day.expanded && (
          <View style={styles.dayWorkouts}>
            {day.workout && (
              <WorkoutItem
                key={`day-${day.id}-workout-${day.workout.id}-${
                  day.workout.selected ? "selected" : "unselected"
                }-${forceUpdateKey}`}
                workout={day.workout}
                dayId={day.id}
                onToggleSelection={onToggleWorkoutSelection}
                onRenderRightActions={onRenderRightActions}
                colors={colors}
              />
            )}
          </View>
        )}
      </View>
    );
  }
);

// Modificar o componente BottomSheetModal para usar React.memo
const BottomSheetContent = React.memo(
  ({
    weekDays,
    isAddingCustomWorkout,
    customWorkoutName,
    customWorkoutIcon,
    customWorkoutColor,
    showIconSelector,
    colors,
    AVAILABLE_COLORS,
    AVAILABLE_ICONS,
    onToggleDayExpansion,
    onSelectAllWorkoutsForDay,
    onToggleWorkoutSelectionForDay,
    onRenderRightActions,
    onStartAddingCustomWorkout,
    onCancelAddingCustomWorkout,
    onCustomWorkoutNameChange,
    onCustomWorkoutIconChange,
    onCustomWorkoutColorChange,
    onToggleIconSelector,
    onAddCustomWorkout,
    onConfirmWorkoutConfig,
    forceUpdateKey,
  }: {
    weekDays: WeekDay[];
    isAddingCustomWorkout: boolean;
    customWorkoutName: string;
    customWorkoutIcon: WorkoutIconType;
    customWorkoutColor: string;
    showIconSelector: boolean;
    colors: any;
    AVAILABLE_COLORS: string[];
    AVAILABLE_ICONS: WorkoutIconType[];
    onToggleDayExpansion: (dayId: number) => void;
    onSelectAllWorkoutsForDay: (dayId: number) => void;
    onToggleWorkoutSelectionForDay: (dayId: number, workoutId: string) => void;
    onRenderRightActions: (id: string, isDefault?: boolean) => React.ReactNode;
    onStartAddingCustomWorkout: () => void;
    onCancelAddingCustomWorkout: () => void;
    onCustomWorkoutNameChange: (text: string) => void;
    onCustomWorkoutIconChange: (icon: WorkoutIconType) => void;
    onCustomWorkoutColorChange: (color: string) => void;
    onToggleIconSelector: () => void;
    onAddCustomWorkout: () => void;
    onConfirmWorkoutConfig: () => void;
    forceUpdateKey?: number;
  }) => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Configurar Treinos Semanais
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            Selecione os treinos para cada dia da semana
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dias da semana */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day) => (
              <DayCard
                key={`day-${day.id}-${
                  day.expanded ? "expanded" : "collapsed"
                }-${forceUpdateKey}`}
                day={day}
                onToggleExpansion={onToggleDayExpansion}
                onSelectAllWorkouts={onSelectAllWorkoutsForDay}
                onToggleWorkoutSelection={onToggleWorkoutSelectionForDay}
                onRenderRightActions={onRenderRightActions}
                colors={colors}
                forceUpdateKey={forceUpdateKey}
              />
            ))}
          </View>

          {/* Adicionar treino personalizado */}
          {isAddingCustomWorkout ? (
            <View style={styles.customWorkoutContainer}>
              <View style={styles.customWorkoutHeader}>
                <Text
                  style={[styles.customWorkoutTitle, { color: colors.text }]}
                >
                  Adicionar Treino Personalizado
                </Text>
                <TouchableOpacity
                  onPress={onCancelAddingCustomWorkout}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.customWorkoutInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                placeholder="Nome do treino"
                placeholderTextColor={colors.text + "50"}
                value={customWorkoutName}
                onChangeText={onCustomWorkoutNameChange}
                autoFocus
              />

              <View style={styles.customWorkoutOptions}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Ícone:
                </Text>
                <TouchableOpacity
                  style={[
                    styles.iconSelector,
                    {
                      backgroundColor: customWorkoutColor,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={onToggleIconSelector}
                >
                  <WorkoutIcon
                    iconType={customWorkoutIcon}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              {showIconSelector && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconList}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={`${icon.type}-${icon.name}`}
                      style={[
                        styles.iconItem,
                        {
                          backgroundColor: colors.card,
                          borderColor:
                            icon.type === customWorkoutIcon.type &&
                            icon.name === customWorkoutIcon.name
                              ? customWorkoutColor
                              : colors.border,
                        },
                      ]}
                      onPress={() => onCustomWorkoutIconChange(icon)}
                    >
                      <WorkoutIcon
                        iconType={icon}
                        size={24}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.customWorkoutOptions}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Cor:
                </Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: color,
                          borderWidth: color === customWorkoutColor ? 3 : 0,
                          borderColor: colors.background,
                        },
                      ]}
                      onPress={() => onCustomWorkoutColorChange(color)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.addCustomWorkoutButton,
                  {
                    backgroundColor: customWorkoutName.trim()
                      ? customWorkoutColor
                      : colors.border,
                    opacity: customWorkoutName.trim() ? 1 : 0.5,
                  },
                ]}
                onPress={onAddCustomWorkout}
                disabled={!customWorkoutName.trim()}
              >
                <Text style={styles.addCustomWorkoutButtonText}>
                  Adicionar Treino
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addCustomButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={onStartAddingCustomWorkout}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.addCustomText, { color: colors.primary }]}>
                Adicionar Treino Personalizado
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <ButtonNew
            title="Confirmar Configuração"
            onPress={onConfirmWorkoutConfig}
            variant="primary"
            iconName="checkmark-outline"
            iconPosition="right"
            style={styles.confirmButton}
            hapticFeedback="notification"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }
);

// Função para converter o formato antigo de ícones para o novo formato
export function convertToIconType(icon: string): WorkoutIconType {
  // Verificar se o ícone já está no formato novo
  if (
    typeof icon === "object" &&
    icon !== null &&
    "type" in icon &&
    "name" in icon
  ) {
    return icon as WorkoutIconType;
  }

  // Determinar o tipo de ícone com base no nome
  if (!icon) {
    return {
      type: "ionicons" as const,
      name: "barbell-outline" as IoniconsNames,
    };
  }

  // Ícones do MaterialCommunityIcons
  const materialIcons = [
    "dumbbell",
    "weight-lifter",
    "human-handsdown",
    "run-fast",
    "arm-flex",
    "arm-flex-outline",
    "human-male",
    "weight",
    "yoga",
    "bike",
  ];

  // Ícones do FontAwesome5
  const fontAwesomeIcons = [
    "dumbbell",
    "running",
    "walking",
    "heartbeat",
    "biking",
    "swimmer",
  ];

  let result: WorkoutIconType;

  if (materialIcons.includes(icon)) {
    result = {
      type: "material" as const,
      name: icon as MaterialIconNames,
    };
  } else if (fontAwesomeIcons.includes(icon)) {
    result = {
      type: "fontawesome" as const,
      name: icon as FontAwesome5Names,
    };
  } else if (icon.includes("outline") || icon.includes("sharp")) {
    result = {
      type: "ionicons" as const,
      name: icon as IoniconsNames,
    };
  } else {
    // Padrão para Ionicons se não conseguir determinar
    result = {
      type: "ionicons" as const,
      name: "barbell-outline" as IoniconsNames,
    };
  }
  return result;
}

// Função para converter o formato novo de ícones para o antigo formato (para compatibilidade)
export function getIconName(iconType: WorkoutIconType | string): string {
  if (typeof iconType === "string") {
    return iconType;
  }

  if (!iconType) {
    return "barbell-outline";
  }

  return iconType.name as string;
}

// Definir cores para os treinos
const WORKOUT_COLORS = [
  // Vermelhos
  "#FF5252", 
  "#E53935",
  "#C62828",
  
  // Laranjas
  "#FF9800", 
  "#FB8C00",
  "#EF6C00",
  
  // Amarelos
  "#FFEB3B", 
  "#FDD835",
  "#F9A825",
  
  // Verdes
  "#4CAF50", 
  "#43A047",
  "#2E7D32",
  
  // Azuis
  "#2196F3", 
  "#1E88E5",
  "#1565C0",
  
  // Roxos
  "#9C27B0", 
  "#8E24AA",
  "#6A1B9A",
  
  // Rosas
  "#F06292",
  "#EC407A",
  "#D81B60",
  
  // Cinzas
  "#9E9E9E",
  "#757575",
  "#616161"
];

// Componente principal
const WorkoutConfigSheet = forwardRef<BottomSheetModal, WorkoutConfigSheetProps>(
  ({ onWorkoutConfigured, selectedDate }, ref) => {
    const { theme } = useTheme(); // Usar o ThemeContext
    const colors = Colors[theme]; // Obter cores com base no tema atual
    const { weeklyTemplate, updateWeeklyTemplate, workoutTypes } = useWorkoutContext();
    const [workoutsChanged, setWorkoutsChanged] = useState(false);
    const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
    
  // Referência para o BottomSheetModal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Repassar a referência para o componente pai
    useImperativeHandle(ref, () => bottomSheetModalRef.current as any);

    // Estado para os dias da semana
  const [weekDays, setWeekDays] = useState<WeekDay[]>([
      { id: 0, name: "Domingo", shortName: "Dom", expanded: false, workout: null },
      { id: 1, name: "Segunda", shortName: "Seg", expanded: false, workout: null },
      { id: 2, name: "Terça", shortName: "Ter", expanded: false, workout: null },
      { id: 3, name: "Quarta", shortName: "Qua", expanded: false, workout: null },
      { id: 4, name: "Quinta", shortName: "Qui", expanded: false, workout: null },
      { id: 5, name: "Sexta", shortName: "Sex", expanded: false, workout: null },
      { id: 6, name: "Sábado", shortName: "Sáb", expanded: false, workout: null },
    ]);

    // Estados para o builder de treino
    const [newWorkoutName, setNewWorkoutName] = useState("");
    const [selectedColor, setSelectedColor] = useState("#FF5252");
    const [selectedIcon, setSelectedIcon] = useState<WorkoutIconType>({
      type: "ionicons",
      name: "barbell-outline",
    });
    const [editingDayId, setEditingDayId] = useState<number | null>(null);

    // Estados para treino personalizado
    const [isAddingCustomWorkout, setIsAddingCustomWorkout] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState("");
    const [customWorkoutIcon, setCustomWorkoutIcon] = useState<WorkoutIconType>({
      type: "ionicons",
      name: "barbell-outline",
    });
    const [customWorkoutColor, setCustomWorkoutColor] = useState("#FF5252");
  const [showIconSelector, setShowIconSelector] = useState(false);

    // Pontos de quebra para o BottomSheetModal
    const snapPoints = useMemo(() => ["90%"], []);

    // Handler para o BottomSheetBackdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
      />
    ),
    []
  );

    // Rotações para as animações de expansão
    const rotations = useMemo(() => {
      const rotationValues: { [key: number]: any } = {};
      weekDays.forEach((day) => {
        // Use a API do React Native padrão para animações básicas
        rotationValues[day.id] = new RNAnimated.Value(0);
      });
      return rotationValues;
  }, []);

    // Carregar configuração existente ao iniciar
  useEffect(() => {
      // Carregar treinos do template semanal
      if (weeklyTemplate) {
        const updatedWeekDays = [...weekDays];
        
        Object.entries(weeklyTemplate).forEach(([dayOfWeek, workouts]) => {
          const dayIndex = parseInt(dayOfWeek);
          if (updatedWeekDays[dayIndex]) {
            // Pegar o primeiro workout configurado (agora temos apenas 1 por dia)
            const workoutId = Object.keys(workouts)[0];
            if (workoutId) {
              const workoutType = workoutTypes.find(w => w.id === workoutId);
              if (workoutType) {
                updatedWeekDays[dayIndex].workout = {
                  ...workoutType,
                  selected: true
                };
              }
            }
          }
        });
        
        setWeekDays(updatedWeekDays);
      }
    }, [weeklyTemplate, workoutTypes]);

    // Quando um dia é expandido, prepara para edição
    const onToggleExpansion = (dayId: number) => {
      const day = weekDays.find(d => d.id === dayId);
      if (!day) return;
      
      // Se expandir, prepara para edição
      if (!day.expanded) {
        // Fechamos todos os outros dias
        setWeekDays(prevDays => 
          prevDays.map(d => ({
            ...d,
            expanded: d.id === dayId ? true : false
          }))
        );
        
        setEditingDayId(dayId);
        
        // Se já existir um treino, preenche os campos
        if (day.workout) {
          setNewWorkoutName(day.workout.name);
          setSelectedColor(day.workout.color);
          setSelectedIcon(day.workout.iconType);
          } else {
          // Limpa os campos para um novo treino
          setNewWorkoutName("");
          setSelectedColor("#FF5252");
          setSelectedIcon({
            type: "ionicons",
            name: "barbell-outline",
          });
        }
        
        // Feedback tátil para indicar expansão
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Se já está expandido, apenas fechamos
        setWeekDays(prevDays => 
          prevDays.map(d => ({
            ...d,
            expanded: d.id === dayId ? false : d.expanded
          }))
        );
        setEditingDayId(null);
      }
    };
    
    // Salva o treino configurado para o dia
    const saveWorkoutForDay = () => {
      if (editingDayId === null || !newWorkoutName.trim()) return;
      
      // Verificar se já existe um tipo de treino com o mesmo nome em outros dias
      const existingWorkoutWithSameName = weekDays
        .filter(day => day.id !== editingDayId && day.workout !== null)
        .find(day => day.workout?.name.toLowerCase() === newWorkoutName.toLowerCase());
      
      // Se existir, reutilizar o ID, iconType e cor para manter consistência
      const workout = existingWorkoutWithSameName?.workout;
      
      setWeekDays(prevDays => {
        return prevDays.map(day => {
          if (day.id === editingDayId) {
            return {
              ...day,
              workout: {
                // Se já existe um treino com o mesmo nome, reutilizar o ID e outros atributos
                id: workout?.id || day.workout?.id || uuidv4(),
                name: newWorkoutName,
                iconType: workout?.iconType || selectedIcon,
                color: workout?.color || selectedColor,
                selected: true,
              },
              expanded: false // Fecha o card após salvar
            };
          }
          return day;
          });
        });

      setWorkoutsChanged(true);
      setEditingDayId(null);
      
      // Feedback tátil para indicar sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    
    // Remove o treino configurado para o dia
    const removeWorkoutForDay = (dayId: number) => {
      setWeekDays(prevDays => {
        return prevDays.map(day => {
          if (day.id === dayId) {
            return {
              ...day,
              workout: null
            };
          }
          return day;
        });
      });
      
      setWorkoutsChanged(true);
      
      // Feedback tátil para indicar remoção
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    // Renderiza o construtor de treino
    const renderWorkoutBuilder = (dayId: number) => {
      const day = weekDays.find(d => d.id === dayId);
      if (!day) return null;
      
      const isEditing = day.workout !== null;
      
      return (
        <View style={styles.workoutBuilder}>
          {/* Campo de nome do treino */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nome do treino</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                color: colors.text,
                backgroundColor: colors.card 
              }]}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Ex: Treino de Peito, Pernas, etc."
              placeholderTextColor={colors.text + "70"}
            />
          </View>
          
          {/* Seletor de cor */}
          {renderColorSelector()}
          
          {/* Seletor de ícone */}
          {renderIconPicker()}
          
          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.card }]}
              onPress={() => onToggleExpansion(dayId)}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
            
        <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: selectedColor }]}
              onPress={saveWorkoutForDay}
              disabled={!newWorkoutName.trim()}
        >
              <Text style={styles.saveButtonText}>
                {isEditing ? "Atualizar Treino" : "Criar Treino"}
              </Text>
        </TouchableOpacity>
          </View>
        </View>
      );
    };

    // Renderiza o estado vazio (sem treino configurado)
    const renderEmptyState = (dayId: number) => {
      const day = weekDays.find(d => d.id === dayId);
      if (!day) return null;
      
      return (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color={colors.text + "50"} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Nenhum treino configurado para {day.name}
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Apenas configura o dia para edição, não precisa toggle novamente
              setEditingDayId(dayId);
              // Inicializa valores padrão para um novo treino
              setNewWorkoutName("");
              setSelectedColor("#FF5252");
              setSelectedIcon({
                type: "ionicons",
                name: "barbell-outline",
              });
              // Feedback tátil
      Haptics.selectionAsync();
            }}
          >
            <Text style={styles.createButtonText}>Criar Treino</Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Renderizar cada dia da semana
    const renderDayItem = ({ item: day }: { item: WeekDay }) => {
      return (
        <MotiView
          key={`day-${day.id}-${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 300,
            delay: day.id * 50,
            easing: Easing.out(Easing.ease),
          }}
          style={styles.dayCardWrapper}
        >
          <TouchableOpacity
            style={[
              styles.dayCard,
              { backgroundColor: colors.card },
              day.expanded && { 
                backgroundColor: day.workout ? day.workout.color + '08' : colors.card,
                borderWidth: 1,
                borderColor: day.workout ? day.workout.color + '30' : colors.border,
              },
            ]}
            onPress={() => onToggleExpansion(day.id)}
            activeOpacity={0.7}
          >
            <View style={styles.dayCardHeader}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayName, { color: colors.text }]}>
                  {day.name}
                </Text>
                {day.workout && (
                  <View
                    style={[
                      styles.workoutChip,
                      { backgroundColor: day.workout.color + "20" },
                    ]}
                  >
                    <View
                      style={[
                        styles.workoutIcon,
                        { backgroundColor: day.workout.color + "40" },
                      ]}
                    >
                      <WorkoutIcon
                        iconType={day.workout.iconType}
                        size={16}
                        color={day.workout.color}
                      />
                    </View>
                    <Text
                      style={[styles.workoutName, { color: day.workout.color }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {day.workout.name}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.dayActions}>
                <Ionicons
                  name={day.expanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text}
                />
              </View>
            </View>

            {day.expanded && (
              <Animated.View 
                entering={FadeIn.duration(200)}
                style={styles.expandedContent}
              >
                {editingDayId === day.id ? (
                  renderWorkoutBuilder(day.id)
                ) : (
                  renderEmptyState(day.id)
                )}
              </Animated.View>
            )}
          </TouchableOpacity>
        </MotiView>
      );
    };

    // Iniciar a adição de um treino personalizado
    const onStartAddingCustomWorkout = () => {
      setIsAddingCustomWorkout(true);
      setCustomWorkoutName("");
      setCustomWorkoutIcon({
        type: "ionicons",
        name: "barbell-outline",
      });
      setCustomWorkoutColor("#FF5252");
      setShowIconSelector(false);
    };

    // Handler para mudança de nome do treino personalizado
    // Verifica se já existe um treino com o mesmo nome e reusa seus atributos
    const handleCustomWorkoutNameChange = (name: string) => {
      setCustomWorkoutName(name);
      
      // Verificar se já existe um treino com o mesmo nome
      const existingWorkoutType = weekDays
        .filter(day => day.workout !== null)
        .map(day => day.workout)
        .find(workout => workout?.name.toLowerCase() === name.toLowerCase());
      
      if (existingWorkoutType) {
        // Reutilizar as propriedades do treino existente
        setCustomWorkoutIcon(existingWorkoutType.iconType);
        setCustomWorkoutColor(existingWorkoutType.color);
      }
    };

    // Adicionar um treino personalizado
    const onAddCustomWorkout = () => {
      if (!customWorkoutName.trim()) return;
      
      // Verificar se já existe um treino com o mesmo nome
      const existingWorkoutType = weekDays
        .filter(day => day.workout !== null)
        .map(day => day.workout)
        .find(workout => workout?.name.toLowerCase() === customWorkoutName.toLowerCase());
      
      // Criar o novo tipo de treino, reusando ID se existir
      const newWorkoutType: WorkoutType = {
        id: existingWorkoutType?.id || uuidv4(),  // Reusar ID se existir
        name: customWorkoutName,
        iconType: customWorkoutIcon,
        color: customWorkoutColor,
        selected: true,
        isDefault: false,
      };
      
      // Adicionar aos tipos de treino disponíveis
      workoutTypes.push(newWorkoutType);
      
      // Limpar o estado de adição
      setIsAddingCustomWorkout(false);
      setWorkoutsChanged(true);
      
      // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Alteração do ícone do treino personalizado
    const onCustomWorkoutIconChange = (icon: WorkoutIconType) => {
      setCustomWorkoutIcon(icon);
      Haptics.selectionAsync();
    };
    
    // Alteração da cor do treino personalizado
    const onCustomWorkoutColorChange = (color: string) => {
      setCustomWorkoutColor(color);
      Haptics.selectionAsync();
    };

    // Salvar toda a configuração
    const saveConfiguration = async () => {
      // Primeiro vamos consolidar tipos de treino com nomes iguais para garantir IDs consistentes
      const workoutNameToIdMap = new Map<string, string>();
      
      // Construir mapa de nome de treino para ID
      weekDays.forEach((day) => {
        if (day.workout) {
          const workoutName = day.workout.name.toLowerCase();
          if (!workoutNameToIdMap.has(workoutName)) {
            workoutNameToIdMap.set(workoutName, day.workout.id);
            }
          }
        });

      // Atualizar weekDays para usar IDs consistentes
      const consolidatedWeekDays = weekDays.map(day => {
        if (!day.workout) return day;
        
        const workoutName = day.workout.name.toLowerCase();
        const consistentId = workoutNameToIdMap.get(workoutName) || day.workout.id;
        
        return {
          ...day,
          workout: {
            ...day.workout,
            id: consistentId
          }
        };
      });
      
      // Atualizar o estado local com os IDs consolidados
      setWeekDays(consolidatedWeekDays);
      
      // Converter para o formato esperado pelo contexto
      const templateConfig: { [key: number]: { [key: string]: Exercise[] } } = {};
      
      consolidatedWeekDays.forEach((day) => {
        if (day.workout) {
          templateConfig[day.id] = {
            [day.workout.id]: [] // Array vazio de exercícios, será preenchido depois
          };
        }
      });
      
      // Atualizar o template semanal
      await updateWeeklyTemplate(templateConfig);
      
      // Criar mapa de IDs únicos para workoutTypes
      const uniqueWorkoutTypes = [...new Map(
        consolidatedWeekDays
          .filter((day) => day.workout !== null)
          .map((day) => day.workout as WorkoutType)
          .map(workout => [workout.id, workout])
      ).values()];
      
      // Não aplicar automaticamente o treino ao dia atual
      // Apenas informar os tipos de treino disponíveis, sem marcar nenhum como selecionado
      const workoutTypesWithoutSelection = uniqueWorkoutTypes.map(workout => ({
        ...workout,
        selected: false // Nenhum treino selecionado para o dia atual
      }));
      
      // Informar os tipos de treino, sem selecionar nenhum para o dia atual
      onWorkoutConfigured(workoutTypesWithoutSelection);
      
      setWorkoutsChanged(false);
      
      // Feedback tátil para indicar sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    
    // Renderizar o seletor de cores
    const renderColorSelector = () => (
      <View style={styles.colorSelector}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cor do treino</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorList}>
          {WORKOUT_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorItem,
                { backgroundColor: color },
                selectedColor === color && styles.colorItemSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
    
    // Renderizar o seletor de ícones
    const renderIconPicker = () => (
      <View style={styles.iconSelector}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ícone do treino</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconList}>
          {AVAILABLE_ICONS.map((icon) => (
            <TouchableOpacity
              key={`${icon.type}-${icon.name}`}
              style={[
                styles.iconItem,
                selectedIcon.type === icon.type && selectedIcon.name === icon.name && 
                { backgroundColor: selectedColor + "30" }
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <WorkoutIcon iconType={icon} size={24} color={colors.text} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: colors.text + "50",
          width: 40,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
        enablePanDownToClose
        enableDismissOnClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="none"
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Configure seus Treinos
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              Configure um treino específico para cada dia da semana
            </Text>
          </View>

          <FlatList
            data={weekDays}
            renderItem={renderDayItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.saveConfigButton,
                !workoutsChanged && styles.saveConfigButtonDisabled,
                { backgroundColor: workoutsChanged ? colors.success : colors.border }
              ]}
              onPress={async () => {
                await saveConfiguration();
                bottomSheetModalRef.current?.dismiss();
              }}
              disabled={!workoutsChanged}
            >
              <Text style={styles.saveConfigButtonText}>Salvar Configuração</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    </BottomSheetModal>
  );
  }
);

export default WorkoutConfigSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveConfigButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveConfigButtonDisabled: {
    opacity: 0.5,
  },
  saveConfigButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dayCardWrapper: {
    marginBottom: 12,
  },
  dayCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    minHeight: 70,
  },
  dayInfo: {
    flex: 1,
    justifyContent: "center",
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  workoutChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  workoutIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  workoutName: {
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 150,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  workoutBuilder: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  workoutItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutSelection: {
    marginLeft: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllDayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectAllDayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dayWorkouts: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    flex: 1,
  },
  weekDaysContainer: {
    marginBottom: 16,
  },
  customWorkoutContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customWorkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  customWorkoutTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  customWorkoutInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  customWorkoutOptions: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  colorSelector: {
    marginBottom: 16,
  },
  colorList: {
    flexDirection: "row",
    marginTop: 8,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  colorItemSelected: {
    borderWidth: 2,
    borderColor: "#000",
  },
  iconSelector: {
    marginBottom: 16,
  },
  iconList: {
    flexDirection: "row",
    marginTop: 8,
  },
  iconItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  confirmButton: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  daySubtitle: {
    fontSize: 14,
    color: "#666",
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
  },
  addCustomWorkoutButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  addCustomWorkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
});
