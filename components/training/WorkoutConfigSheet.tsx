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
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useWorkouts } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";

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
  workouts: WorkoutType[];
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
    console.log("WorkoutIcon: iconType é undefined, usando fallback");
    // Renderizar um ícone padrão como fallback
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  // Verificar se o tipo e o nome são válidos
  if (!iconType.type || !iconType.name) {
    console.log(
      "WorkoutIcon: iconType incompleto, usando fallback",
      JSON.stringify(iconType)
    );
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  console.log("WorkoutIcon:", JSON.stringify(iconType));

  if (iconType.type === "material") {
    console.log("Renderizando MaterialCommunityIcon:", iconType.name);
    return (
      <MaterialCommunityIcons
        name={iconType.name as MaterialIconNames}
        size={size}
        color={color}
      />
    );
  } else if (iconType.type === "fontawesome") {
    console.log("Renderizando FontAwesome5:", iconType.name);
    return (
      <FontAwesome5
        name={iconType.name as FontAwesome5Names}
        size={size}
        color={color}
      />
    );
  } else {
    console.log("Renderizando Ionicons:", iconType.name);
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
    console.log(
      `WorkoutItem para ${workout.name}:`,
      JSON.stringify(workout.iconType)
    );

    // Verificar se o iconType está definido corretamente
    if (!workout.iconType) {
      console.log(
        `ALERTA: WorkoutItem sem iconType para ${workout.name}, definindo padrão`
      );

      // Procurar o tipo padrão correspondente para obter o iconType correto
      const defaultType = DEFAULT_WORKOUT_TYPES.find(
        (type) => type.id === workout.id
      );
      if (defaultType && defaultType.iconType) {
        console.log(`Usando iconType do tipo padrão para ${workout.name}`);
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
            {
              backgroundColor: workout.selected
                ? workout.color + "20"
                : colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onToggleSelection(dayId, workout.id)}
          activeOpacity={0.7}
        >
          <View style={styles.workoutInfo}>
            <View
              style={[
                styles.workoutIconContainer,
                { backgroundColor: workout.color },
              ]}
            >
              <WorkoutIcon
                iconType={workout.iconType}
                size={20}
                color="white"
              />
            </View>
            <Text style={[styles.workoutName, { color: colors.text }]}>
              {workout.name}
            </Text>
          </View>
          <View style={styles.workoutSelection}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: workout.selected
                    ? workout.color
                    : "transparent",
                  borderColor: workout.selected ? workout.color : colors.border,
                },
              ]}
            >
              {workout.selected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
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
              {day.workouts.filter((w) => w.selected).length} treinos
              selecionados
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
            {day.workouts.map((workout) => (
              <WorkoutItem
                key={`day-${day.id}-workout-${workout.id}-${
                  workout.selected ? "selected" : "unselected"
                }-${forceUpdateKey}`}
                workout={workout}
                dayId={day.id}
                onToggleSelection={onToggleWorkoutSelection}
                onRenderRightActions={onRenderRightActions}
                colors={colors}
              />
            ))}
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
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
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
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={`${icon.type}-${icon.name}`}
                      style={[
                        styles.iconOption,
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
                        color={
                          icon.type === customWorkoutIcon.type &&
                          icon.name === customWorkoutIcon.name
                            ? customWorkoutColor
                            : colors.text
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
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
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={onConfirmWorkoutConfig}
          >
            <Text style={styles.confirmButtonText}>Confirmar Configuração</Text>
          </TouchableOpacity>
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
    console.log("Ícone já está no formato novo:", JSON.stringify(icon));
    return icon as WorkoutIconType;
  }

  console.log("Convertendo ícone:", icon);

  // Determinar o tipo de ícone com base no nome
  if (!icon) {
    console.log("Ícone indefinido, usando padrão");
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
    console.log("Convertendo para MaterialCommunityIcons:", icon);
    result = {
      type: "material" as const,
      name: icon as MaterialIconNames,
    };
  } else if (fontAwesomeIcons.includes(icon)) {
    console.log("Convertendo para FontAwesome5:", icon);
    result = {
      type: "fontawesome" as const,
      name: icon as FontAwesome5Names,
    };
  } else if (icon.includes("outline") || icon.includes("sharp")) {
    console.log("Convertendo para Ionicons:", icon);
    result = {
      type: "ionicons" as const,
      name: icon as IoniconsNames,
    };
  } else {
    console.log("Tipo de ícone não reconhecido, usando padrão:", icon);
    // Padrão para Ionicons se não conseguir determinar
    result = {
      type: "ionicons" as const,
      name: "barbell-outline" as IoniconsNames,
    };
  }

  console.log("Resultado final da conversão:", JSON.stringify(result));
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

// Componente WorkoutConfigSheet
const WorkoutConfigSheet = forwardRef<
  BottomSheetModal,
  WorkoutConfigSheetProps
>(({ onWorkoutConfigured, selectedDate }, ref) => {
  // Referência para o BottomSheetModal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Configuração do tema
  const { theme } = useTheme();
  const colors = Colors[theme];
  const systemTheme = useColorScheme();

  // Estado de carregamento para evitar travamentos na primeira renderização
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar se o sheet está aberto
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Estado para forçar re-renderização
  const [forceUpdate, setForceUpdate] = useState(0);

  // Usar o contexto de treinos
  const {
    workoutTypes: contextWorkoutTypes,
    hasWorkoutTypesConfigured,
    workouts,
    selectedDate: contextSelectedDate,
    weeklyTemplate,
    updateWeeklyTemplate,
    hasWeeklyTemplateConfigured,
  } = useWorkouts();

  // Expor a referência para o componente pai
  useImperativeHandle(ref, () => {
    return bottomSheetModalRef.current!;
  });

  // Estados
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [customWorkoutName, setCustomWorkoutName] = useState("");
  const [selectedIconType, setSelectedIconType] = useState<WorkoutIconType>({
    type: "material",
    name: "dumbbell",
  });
  const [selectedColor, setSelectedColor] = useState("#FF5252");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [isAddingCustomWorkout, setIsAddingCustomWorkout] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Novo estado para os dias da semana
  const [weekDays, setWeekDays] = useState<WeekDay[]>([
    { id: 0, name: "Domingo", shortName: "Dom", expanded: false, workouts: [] },
    { id: 1, name: "Segunda", shortName: "Seg", expanded: false, workouts: [] },
    { id: 2, name: "Terça", shortName: "Ter", expanded: false, workouts: [] },
    { id: 3, name: "Quarta", shortName: "Qua", expanded: false, workouts: [] },
    { id: 4, name: "Quinta", shortName: "Qui", expanded: false, workouts: [] },
    { id: 5, name: "Sexta", shortName: "Sex", expanded: false, workouts: [] },
    { id: 6, name: "Sábado", shortName: "Sáb", expanded: false, workouts: [] },
  ]);

  // Cores disponíveis para treinos personalizados
  const AVAILABLE_COLORS = [
    "#FF5252", // Vermelho
    "#448AFF", // Azul
    "#66BB6A", // Verde
    "#FFA726", // Laranja
    "#AB47BC", // Roxo
    "#26C6DA", // Ciano
    "#EF5350", // Vermelho claro
    "#7E57C2", // Roxo escuro
    "#42A5F5", // Azul claro
    "#FF7043", // Laranja escuro
    "#EC407A", // Rosa
    "#9CCC65", // Verde claro
  ];

  // Pontos de ancoragem do bottom sheet
  const snapPoints = useMemo(() => ["70%", "90%"], []);

  // Inicializar os tipos de treinos com os existentes ou os padrões
  useEffect(() => {
    // Sempre inicializar com os tipos padrão, todos desmarcados
    const initialTypes = DEFAULT_WORKOUT_TYPES.map((type) => ({
      ...type,
      selected: false,
    }));

    // Se existirem tipos configurados, marcá-los como selecionados
    if (contextWorkoutTypes.length > 0) {
      // Marcar os tipos existentes como selecionados
      initialTypes.forEach((type) => {
        const existingType = contextWorkoutTypes.find(
          (et) => et.id === type.id
        );
        if (existingType) {
          type.selected = true;
        }
      });

      // Adicionar tipos personalizados que não estão nos padrões
      contextWorkoutTypes.forEach((existingType) => {
        const isCustomType = !initialTypes.some(
          (dt) => dt.id === existingType.id
        );
        if (isCustomType) {
          initialTypes.push({
            ...existingType,
            selected: true,
          });
        }
      });
    }

    setWorkoutTypes(initialTypes);

    // Adicionar um pequeno atraso para garantir que a UI esteja pronta
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [contextWorkoutTypes]);

  // Função para atualizar os tipos de treino com base no template semanal
  const updateWorkoutTypesFromTemplate = useCallback(() => {
    try {
      if (
        !hasWorkoutTypesConfigured ||
        !contextWorkoutTypes ||
        contextWorkoutTypes.length === 0
      ) {
        return;
      }

      console.log("Atualizando tipos de treino do template");

      // Criar uma cópia profunda dos tipos de treino do contexto
      const updatedWorkoutTypes = JSON.parse(
        JSON.stringify(contextWorkoutTypes)
      );

      console.log(
        "Tipos de treino antes da conversão:",
        JSON.stringify(updatedWorkoutTypes)
      );

      // Converter ícones do formato antigo para o novo formato, se necessário
      updatedWorkoutTypes.forEach((workoutType: any) => {
        if (workoutType.icon && !workoutType.iconType) {
          console.log(
            "Convertendo ícone em updateWorkoutTypesFromTemplate:",
            workoutType.icon
          );
          workoutType.iconType = convertToIconType(workoutType.icon);
          console.log(
            "Resultado da conversão:",
            JSON.stringify(workoutType.iconType)
          );
          // Não remover a propriedade icon para manter compatibilidade
        } else if (!workoutType.iconType) {
          console.log(
            "ALERTA: workoutType sem iconType e sem icon:",
            workoutType.name
          );

          // Procurar o tipo padrão correspondente para obter o iconType correto
          const defaultType = DEFAULT_WORKOUT_TYPES.find(
            (type) => type.id === workoutType.id
          );
          if (defaultType && defaultType.iconType) {
            console.log(
              "Usando iconType do tipo padrão para:",
              workoutType.name
            );
            workoutType.iconType = { ...defaultType.iconType };
          } else {
            // Definir um iconType padrão se não encontrar
            workoutType.iconType = {
              type: "ionicons" as const,
              name: "barbell-outline" as IoniconsNames,
            };
          }
        }
      });

      console.log(
        "Tipos de treino após a conversão:",
        JSON.stringify(updatedWorkoutTypes)
      );

      // Atualizar os dias da semana com base no template semanal
      setWeekDays((prev) => {
        const updatedWeekDays = [...prev];

        // Para cada dia da semana
        updatedWeekDays.forEach((day) => {
          // Obter os treinos configurados para este dia da semana
          const workoutsForDay = weeklyTemplate[day.id] || {};
          const workoutIdsForDay = Object.keys(workoutsForDay);

          // Atualizar os treinos para este dia
          day.workouts = updatedWorkoutTypes.map((workoutType: WorkoutType) => {
            // Verificar se o iconType está definido corretamente
            if (!workoutType.iconType) {
              console.log(
                "ALERTA: workoutType sem iconType ao atualizar dias:",
                workoutType.name
              );

              // Procurar o tipo padrão correspondente para obter o iconType correto
              const defaultType = DEFAULT_WORKOUT_TYPES.find(
                (type) => type.id === workoutType.id
              );
              if (defaultType && defaultType.iconType) {
                console.log(
                  "Usando iconType do tipo padrão para dia:",
                  workoutType.name
                );
                workoutType.iconType = { ...defaultType.iconType };
              } else {
                // Definir um iconType padrão se não encontrar
                workoutType.iconType = {
                  type: "ionicons" as const,
                  name: "barbell-outline" as IoniconsNames,
                };
              }
            }

            return {
              ...workoutType,
              selected: workoutIdsForDay.includes(workoutType.id),
            };
          });
        });

        return updatedWeekDays;
      });

      // Atualizar os tipos de treino
      setWorkoutTypes(updatedWorkoutTypes);
    } catch (error) {
      console.error("Erro ao atualizar tipos de treino do template:", error);
    }
  }, [hasWorkoutTypesConfigured, contextWorkoutTypes, weeklyTemplate]);

  // Atualizar os tipos de treino quando o bottom sheet for aberto
  const handleSheetChanges = useCallback(
    (index: number) => {
      // Quando o bottom sheet é aberto pela primeira vez (index muda de -1 para outro valor)
      // Não atualizamos quando o usuário muda entre os snap points (70% e 90%)
      if (index === 0) {
        setIsSheetOpen(true);
        updateWorkoutTypesFromTemplate();
      } else if (index === -1) {
        // Bottom sheet fechado
        setIsSheetOpen(false);
      }
    },
    [updateWorkoutTypesFromTemplate]
  );

  // Efeito para monitorar o estado do teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Formatar a data selecionada para exibição
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return selectedDate.toLocaleDateString("pt-BR", options);
  }, [selectedDate]);

  // Renderizar o backdrop do bottom sheet
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // Atualizar os tipos de treino quando o contexto muda
  useEffect(() => {
    // Apenas atualizar se o bottom sheet estiver aberto
    if (isSheetOpen) {
      updateWorkoutTypesFromTemplate();
    }
  }, [isSheetOpen, updateWorkoutTypesFromTemplate]);

  // Função para iniciar a adição de um treino personalizado
  const startAddingCustomWorkout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddingCustomWorkout(true);
    setCustomWorkoutName("");
    setSelectedIconType({
      type: "material",
      name: "dumbbell",
    });
    setSelectedColor("#FF5252");
    setShowIconSelector(false);
  }, []);

  // Função para cancelar a adição de um treino personalizado
  const cancelAddingCustomWorkout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddingCustomWorkout(false);
    Keyboard.dismiss();
  }, []);

  // Função para adicionar um treino personalizado
  const addCustomWorkout = useCallback(() => {
    if (!customWorkoutName.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newWorkout: WorkoutType = {
      id: `custom-${Date.now()}`,
      name: customWorkoutName.trim(),
      iconType: selectedIconType,
      color: selectedColor,
      selected: false,
    };

    console.log("Adicionando treino personalizado:", newWorkout);

    // Adicionar o novo treino aos tipos de treino
    setWorkoutTypes((prev) => [...prev, newWorkout]);

    // Adicionar o novo treino a todos os dias da semana
    setWeekDays((prev) => {
      const updatedWeekDays = [...prev];

      // Para cada dia da semana
      updatedWeekDays.forEach((day) => {
        // Adicionar o novo treino
        day.workouts.push({ ...newWorkout, selected: false });
      });

      return updatedWeekDays;
    });

    setIsAddingCustomWorkout(false);
    setCustomWorkoutName("");
    Keyboard.dismiss();
  }, [customWorkoutName, selectedIconType, selectedColor]);

  // Função para alternar a seleção de um treino para um dia específico
  const toggleWorkoutSelectionForDay = useCallback(
    (dayId: number, workoutId: string) => {
      Haptics.selectionAsync();

      setWeekDays((prev) => {
        const updatedWeekDays = JSON.parse(JSON.stringify(prev)); // Deep copy para garantir nova referência

        // Encontrar o dia
        const dayIndex = updatedWeekDays.findIndex(
          (day: WeekDay) => day.id === dayId
        );
        if (dayIndex === -1) return prev;

        // Encontrar o treino
        const workoutIndex = updatedWeekDays[dayIndex].workouts.findIndex(
          (workout: WorkoutType) => workout.id === workoutId
        );
        if (workoutIndex === -1) return prev;

        // Alternar a seleção
        updatedWeekDays[dayIndex].workouts[workoutIndex].selected =
          !updatedWeekDays[dayIndex].workouts[workoutIndex].selected;

        // Forçar atualização imediata
        setForceUpdate((prev) => prev + 1);

        return updatedWeekDays;
      });
    },
    []
  );

  // Função para expandir/colapsar um dia da semana
  const toggleDayExpansion = useCallback((dayId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setWeekDays((prev) => {
      const updatedWeekDays = JSON.parse(JSON.stringify(prev)); // Deep copy para garantir nova referência

      // Encontrar o dia
      const dayIndex = updatedWeekDays.findIndex(
        (day: WeekDay) => day.id === dayId
      );
      if (dayIndex === -1) return prev;

      // Alternar a expansão
      updatedWeekDays[dayIndex].expanded = !updatedWeekDays[dayIndex].expanded;

      // Forçar atualização imediata
      setForceUpdate((prev) => prev + 1);

      return updatedWeekDays;
    });
  }, []);

  // Função para selecionar todos os treinos para um dia específico
  const selectAllWorkoutsForDay = useCallback((dayId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setWeekDays((prev) => {
      const updatedWeekDays = JSON.parse(JSON.stringify(prev)); // Deep copy para garantir nova referência

      // Encontrar o dia
      const dayIndex = updatedWeekDays.findIndex(
        (day: WeekDay) => day.id === dayId
      );
      if (dayIndex === -1) return prev;

      // Selecionar todos os treinos
      updatedWeekDays[dayIndex].workouts = updatedWeekDays[
        dayIndex
      ].workouts.map((workout: WorkoutType) => ({
        ...workout,
        selected: true,
      }));

      // Forçar atualização imediata
      setForceUpdate((prev) => prev + 1);

      return updatedWeekDays;
    });
  }, []);

  // Função para confirmar a configuração dos treinos
  const confirmWorkoutConfig = useCallback(() => {
    // Criar o template semanal
    const template: { [dayOfWeek: number]: { [workoutId: string]: any[] } } =
      {};

    // Para cada dia da semana
    weekDays.forEach((day) => {
      // Obter os treinos selecionados
      const selectedWorkouts = day.workouts.filter(
        (workout) => workout.selected
      );

      // Se houver treinos selecionados, adicionar ao template
      if (selectedWorkouts.length > 0) {
        template[day.id] = {};

        // Para cada treino selecionado
        selectedWorkouts.forEach((workout) => {
          template[day.id][workout.id] = [];
        });
      }
    });

    console.log("Template semanal a ser salvo:", JSON.stringify(template));

    // Atualizar o template semanal
    updateWeeklyTemplate(template);

    // Preparar os tipos de treino para o contexto
    // Adicionar a propriedade 'icon' para compatibilidade com o formato antigo
    const compatibleWorkoutTypes = workoutTypes.map((workoutType) => {
      const compatibleType = { ...workoutType };
      // Adicionar a propriedade 'icon' com o nome do ícone para compatibilidade
      (compatibleType as any).icon = getIconName(workoutType.iconType);
      return compatibleType;
    });

    // Atualizar os tipos de treino no contexto
    onWorkoutConfigured(compatibleWorkoutTypes);

    // Fechar o bottom sheet
    bottomSheetModalRef.current?.dismiss();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [weekDays, workoutTypes, updateWeeklyTemplate, onWorkoutConfigured]);

  // Função para remover um treino
  const removeWorkout = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Remover o treino dos tipos de treino
    setWorkoutTypes((prev) => prev.filter((workout) => workout.id !== id));

    // Remover o treino de todos os dias da semana
    setWeekDays((prev) => {
      const updatedWeekDays = [...prev];

      // Para cada dia da semana
      updatedWeekDays.forEach((day) => {
        // Remover o treino
        day.workouts = day.workouts.filter((workout) => workout.id !== id);
      });

      return updatedWeekDays;
    });
  }, []);

  // Função para renderizar as ações de deslize (swipe)
  const renderRightActions = useCallback(
    (id: string, isDefault: boolean | undefined) => {
      if (isDefault) return null;

      return (
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.danger }]}
          onPress={() => removeWorkout(id)}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      );
    },
    [colors.danger, removeWorkout]
  );

  // Inicializar os tipos de treinos
  useEffect(() => {
    try {
      // Se já existirem tipos de treinos configurados, usá-los como base
      if (
        hasWorkoutTypesConfigured &&
        contextWorkoutTypes &&
        contextWorkoutTypes.length > 0
      ) {
        console.log("Inicializando tipos de treino a partir do contexto");

        // Criar uma cópia profunda dos tipos de treino do contexto
        const updatedWorkoutTypes = JSON.parse(
          JSON.stringify(contextWorkoutTypes)
        );

        console.log(
          "Tipos de treino do contexto:",
          JSON.stringify(updatedWorkoutTypes)
        );

        // Converter ícones do formato antigo para o novo formato, se necessário
        updatedWorkoutTypes.forEach((workoutType: any) => {
          if (workoutType.icon && !workoutType.iconType) {
            console.log(
              "Convertendo ícone na inicialização:",
              workoutType.icon
            );
            workoutType.iconType = convertToIconType(workoutType.icon);
            console.log(
              "Resultado da conversão na inicialização:",
              JSON.stringify(workoutType.iconType)
            );
            delete workoutType.icon;
          } else if (!workoutType.iconType) {
            console.log(
              "ALERTA na inicialização: workoutType sem iconType e sem icon:",
              workoutType.name
            );

            // Procurar o tipo padrão correspondente para obter o iconType correto
            const defaultType = DEFAULT_WORKOUT_TYPES.find(
              (type) => type.id === workoutType.id
            );
            if (defaultType && defaultType.iconType) {
              console.log(
                "Usando iconType do tipo padrão para:",
                workoutType.name
              );
              workoutType.iconType = { ...defaultType.iconType };
            } else {
              // Definir um iconType padrão se não encontrar
              workoutType.iconType = {
                type: "ionicons" as const,
                name: "barbell-outline" as IoniconsNames,
              };
            }
          }
        });

        console.log(
          "Tipos de treino após conversão na inicialização:",
          JSON.stringify(updatedWorkoutTypes)
        );

        // Adicionar tipos padrão que não estão no contexto
        DEFAULT_WORKOUT_TYPES.forEach((defaultType) => {
          const existingType = updatedWorkoutTypes.find(
            (type: WorkoutType) => type.id === defaultType.id
          );
          if (!existingType) {
            updatedWorkoutTypes.push({ ...defaultType, selected: false });
          }
        });

        setWorkoutTypes(updatedWorkoutTypes);

        // Atualizar os dias da semana com base no template semanal
        setWeekDays((prev) => {
          const updatedWeekDays = [...prev];

          // Para cada dia da semana
          updatedWeekDays.forEach((day) => {
            // Obter os treinos configurados para este dia da semana
            const workoutsForDay = weeklyTemplate[day.id] || {};
            const workoutIdsForDay = Object.keys(workoutsForDay);

            // Atualizar os treinos para este dia
            day.workouts = updatedWorkoutTypes.map(
              (workoutType: WorkoutType) => ({
                ...workoutType,
                selected: workoutIdsForDay.includes(workoutType.id),
              })
            );
          });

          return updatedWeekDays;
        });
      } else {
        // Caso contrário, usar os tipos padrão
        setWorkoutTypes(DEFAULT_WORKOUT_TYPES);

        // Inicializar os dias da semana com os tipos padrão
        setWeekDays((prev) => {
          const updatedWeekDays = [...prev];

          // Para cada dia da semana
          updatedWeekDays.forEach((day) => {
            // Inicializar com os tipos padrão
            day.workouts = DEFAULT_WORKOUT_TYPES.map((workoutType) => {
              // Garantir que o iconType está definido corretamente
              if (!workoutType.iconType) {
                console.log(
                  "ALERTA: workoutType padrão sem iconType:",
                  workoutType.name
                );

                // Definir um iconType padrão
                workoutType.iconType = {
                  type: "ionicons" as const,
                  name: "barbell-outline" as IoniconsNames,
                };
              }

              return {
                ...workoutType,
                selected: false,
              };
            });
          });

          return updatedWeekDays;
        });
      }
    } catch (error) {
      console.error("Erro ao inicializar tipos de treino:", error);
      // Em caso de erro, usar os tipos padrão
      setWorkoutTypes(DEFAULT_WORKOUT_TYPES);
    }
  }, [hasWorkoutTypesConfigured, contextWorkoutTypes, weeklyTemplate]);

  // Efeito para inicializar os dados com um pequeno atraso
  useEffect(() => {
    // Adicionar um pequeno atraso para garantir que a UI esteja pronta
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Adicionar um componente de carregamento
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  // Renderização do componente
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      onDismiss={() => {
        setIsSheetOpen(false);
      }}
    >
      <BottomSheetContent
        weekDays={weekDays}
        isAddingCustomWorkout={isAddingCustomWorkout}
        customWorkoutName={customWorkoutName}
        customWorkoutIcon={selectedIconType}
        customWorkoutColor={selectedColor}
        showIconSelector={showIconSelector}
        colors={colors}
        AVAILABLE_COLORS={AVAILABLE_COLORS}
        AVAILABLE_ICONS={AVAILABLE_ICONS}
        onToggleDayExpansion={toggleDayExpansion}
        onSelectAllWorkoutsForDay={selectAllWorkoutsForDay}
        onToggleWorkoutSelectionForDay={toggleWorkoutSelectionForDay}
        onRenderRightActions={renderRightActions}
        onStartAddingCustomWorkout={startAddingCustomWorkout}
        onCancelAddingCustomWorkout={cancelAddingCustomWorkout}
        onCustomWorkoutNameChange={setCustomWorkoutName}
        onCustomWorkoutIconChange={setSelectedIconType}
        onCustomWorkoutColorChange={setSelectedColor}
        onToggleIconSelector={() => setShowIconSelector(!showIconSelector)}
        onAddCustomWorkout={addCustomWorkout}
        onConfirmWorkoutConfig={confirmWorkoutConfig}
        forceUpdateKey={forceUpdate}
      />
    </BottomSheetModal>
  );
});

export default WorkoutConfigSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
  },
  weekDaysContainer: {
    marginBottom: 16,
  },
  dayCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  daySubtitle: {
    fontSize: 14,
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
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  workoutInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  workoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "500",
  },
  workoutSelection: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  customWorkoutContainer: {
    backgroundColor: "transparent",
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
    fontWeight: "bold",
  },
  customWorkoutInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  customWorkoutOptions: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  iconSelector: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 4,
  },
  addCustomWorkoutButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addCustomWorkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 16,
  },
  confirmButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
});
