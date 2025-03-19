import React, {
  forwardRef,
  useCallback,
  useState,
  useEffect,
  ForwardedRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { v4 as uuidv4 } from "uuid";
import { MotiView } from "moti";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";
import { useAuth } from "../../context/AuthContext";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import Input from "../common/Input";

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
    id: "Treino A",
    name: "Treino A",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#FF5252",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino B",
    name: "Treino B",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#448AFF",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino C",
    name: "Treino C",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#66BB6A",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino D",
    name: "Treino D",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#FFA726",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino E",
    name: "Treino E",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#AB47BC",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino F",
    name: "Treino F",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#26A69A",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino G",
    name: "Treino G",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#EC407A",
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

// Cores disponíveis para treinos
const AVAILABLE_COLORS: string[] = [
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
  "#616161",
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

// Componente principal
const WorkoutConfigSheet = forwardRef<
  BottomSheetModal,
  WorkoutConfigSheetProps
>(
  (
    { onWorkoutConfigured, selectedDate },
    ref: ForwardedRef<BottomSheetModal>
  ) => {
    const { user } = useAuth();
    const userId = user?.uid || "anonymous";
    const { theme } = useTheme();
    const colors = Colors[theme];
    const {
      updateWorkoutTypes,
      saveAvailableWorkoutTypes,
      getAvailableWorkoutTypes,
    } = useWorkoutContext();

    // Estados
    const [availableWorkoutTypes, setAvailableWorkoutTypes] = useState<
      WorkoutType[]
    >(DEFAULT_WORKOUT_TYPES);
    const [isAddingCustomWorkout, setIsAddingCustomWorkout] = useState(false);
    const [customWorkout, setCustomWorkout] = useState<{
      id: string;
      name: string;
      color: string;
      iconType: WorkoutIconType;
    }>({
      id: "",
      name: "",
      color: "#FF5252",
      iconType: {
        type: "ionicons",
        name: "barbell-outline" as IoniconsNames,
      },
    });

    // Carregar tipos de treino disponíveis do AsyncStorage
    useEffect(() => {
      const loadWorkoutTypes = async () => {
        try {
          console.log("Carregando tipos de treino de AsyncStorage...");
          const storedTypes = await AsyncStorage.getItem(
            `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
          );

          if (storedTypes) {
            const parsedTypes = JSON.parse(storedTypes);
            console.log(
              `Carregados ${parsedTypes.length} tipos de treino do AsyncStorage`
            );

            if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
              setAvailableWorkoutTypes(parsedTypes);
              return;
            }
          }

          // Fallback para os tipos do contexto
          const contextTypes = getAvailableWorkoutTypes();
          if (Array.isArray(contextTypes) && contextTypes.length > 0) {
            console.log(
              `Usando ${contextTypes.length} tipos de treino do contexto`
            );
            setAvailableWorkoutTypes(contextTypes);
            return;
          }

          // Se não há dados salvos nem no contexto, usar os padrões
          console.log("Usando tipos de treino padrão");
          setAvailableWorkoutTypes(DEFAULT_WORKOUT_TYPES);
        } catch (error) {
          console.error("Erro ao carregar tipos de treino:", error);
          setAvailableWorkoutTypes(DEFAULT_WORKOUT_TYPES);
        }
      };

      loadWorkoutTypes();
    }, [userId, getAvailableWorkoutTypes]);

    // Funções otimizadas
    const toggleWorkoutSelection = useCallback((workout: WorkoutType) => {
      setAvailableWorkoutTypes((prevWorkoutTypes) => {
        const updatedWorkoutTypes = prevWorkoutTypes.map((wt) => {
          if (wt.id === workout.id) {
            return { ...wt, selected: !wt.selected };
          }
          return wt;
        });

        return updatedWorkoutTypes;
      });

      // Removemos o setTimeout e as chamadas para atualizar o contexto global
      // Agora isso só acontecerá quando o usuário clicar em Salvar Configuração
    }, []);

    const startEditingWorkout = (workout: WorkoutType) => {
      setIsAddingCustomWorkout(true);
      setCustomWorkout({
        id: workout.id,
        name: workout.name,
        color: workout.color,
        iconType: workout.iconType,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onSaveCustomWorkout = useCallback(() => {
      if (customWorkout.name.trim() === "") {
        Alert.alert("Erro", "Por favor, insira um nome para o treino.");
        return;
      }

      setAvailableWorkoutTypes((prevWorkoutTypes) => {
        const updatedWorkoutTypes = prevWorkoutTypes.map((wt) => {
          if (wt.id === customWorkout.id) {
            return {
              ...wt,
              name: customWorkout.name,
              color: customWorkout.color,
              iconType: customWorkout.iconType,
            };
          }
          return wt;
        });
        return updatedWorkoutTypes;
      });

      setIsAddingCustomWorkout(false);
      setCustomWorkout({
        id: "",
        name: "",
        color: "#FF5252",
        iconType: {
          type: "ionicons",
          name: "barbell-outline" as IoniconsNames,
        },
      });
    }, [customWorkout]);

    // Função para deletar treino
    const renderRightActions = useCallback(
      (workout: WorkoutType) => {
        return (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={() => {
              Alert.alert(
                "Confirmar exclusão",
                `Tem certeza que deseja excluir o treino "${workout.name}"?`,
                [
                  {
                    text: "Cancelar",
                    style: "cancel",
                  },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                      setAvailableWorkoutTypes((prevWorkoutTypes) => {
                        const updatedWorkoutTypes = prevWorkoutTypes.filter(
                          (wt) => wt.id !== workout.id
                        );
                        return updatedWorkoutTypes;
                      });

                      // Removemos o setTimeout e as chamadas para atualizar o contexto global
                      // Agora isso só acontecerá quando o usuário clicar em Salvar Configuração
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        );
      },
      [colors.danger]
    );

    const onCancelAddingCustomWorkout = () => {
      setIsAddingCustomWorkout(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleNameChange = (text: string) => {
      setCustomWorkout({
        ...customWorkout,
        name: text,
      });
    };

    const updateCustomWorkout = (property: string, value: any) => {
      setCustomWorkout({
        ...customWorkout,
        [property]: value,
      });
    };

    const handleSaveWorkoutTypes = async () => {
      try {
        // Salvar localmente
        await saveAvailableWorkoutTypes(availableWorkoutTypes);

        // Sincronizar com Firebase se o usuário estiver autenticado e não for anônimo
        if (user && !user.isAnonymous) {
          try {
            const db = getFirestore();
            const workoutsRef = doc(db, "users", user.uid, "workouts", "data");

            await setDoc(
              workoutsRef,
              {
                availableWorkoutTypes: availableWorkoutTypes,
                lastUpdated: serverTimestamp(),
              },
              { merge: true }
            );

            console.log("Tipos de treino sincronizados com Firebase");
          } catch (firebaseError) {
            console.error(
              "Erro ao sincronizar tipos de treino com Firebase:",
              firebaseError
            );
          }
        }

        // Atualizar o contexto
        updateWorkoutTypes(availableWorkoutTypes);

        // Notificar que a configuração foi concluída
        onWorkoutConfigured?.(availableWorkoutTypes);

        // Fechar o modal
        if (typeof ref === "function") {
          ref(null);
        } else if (ref?.current) {
          ref.current.dismiss();
        }
      } catch (error) {
        console.error("Erro ao salvar tipos de treino:", error);
      }
    };

    // Renderizar o formulário de adição de treino personalizado
    const renderCustomWorkoutForm = () => (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 350 }}
        style={[
          styles.customWorkoutContainer,
          { backgroundColor: colors.card },
        ]}
      >
        <View style={styles.customWorkoutHeader}>
          <View style={styles.headerTitleContainer}>
            <View
              style={[
                styles.headerIconBadge,
                { backgroundColor: customWorkout.color },
              ]}
            >
              <WorkoutIcon
                iconType={customWorkout.iconType}
                size={24}
                color="#FFF"
              />
            </View>
            <Text style={[styles.customWorkoutTitle, { color: colors.text }]}>
              Editar Treino {customWorkout.name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancelAddingCustomWorkout}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={28}
              color={colors.text + "80"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nome do Treino
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderLeftWidth: 4,
                borderLeftColor: customWorkout.color,
                borderColor: colors.border,
              },
            ]}
            value={customWorkout.name}
            onChangeText={handleNameChange}
            placeholder="Ex: Peito, Costas, etc..."
            placeholderTextColor={colors.text + "50"}
            autoFocus={true}
            autoCorrect={false}
            maxLength={20}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.colorSelectorContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cor do Treino
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorList}
          >
            {AVAILABLE_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  customWorkout.color === color && styles.colorOptionSelected,
                ]}
                onPress={() => updateCustomWorkout("color", color)}
              >
                {customWorkout.color === color && (
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.iconSelectorContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ícone do Treino
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconList}
          >
            {AVAILABLE_ICONS.map((icon, index) => (
              <TouchableOpacity
                key={`${icon.type}-${icon.name}-${index}`}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor:
                      customWorkout.iconType.type === icon.type &&
                      customWorkout.iconType.name === icon.name
                        ? customWorkout.color
                        : colors.background,
                    borderColor:
                      customWorkout.iconType.type === icon.type &&
                      customWorkout.iconType.name === icon.name
                        ? customWorkout.color
                        : colors.border,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => updateCustomWorkout("iconType", icon)}
              >
                <WorkoutIcon
                  iconType={icon}
                  size={24}
                  color={
                    customWorkout.iconType.type === icon.type &&
                    customWorkout.iconType.name === icon.name
                      ? "#FFF"
                      : colors.text + "80"
                  }
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={onCancelAddingCustomWorkout}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: customWorkout.color },
            ]}
            onPress={onSaveCustomWorkout}
          >
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#FFF"
              style={styles.saveButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </MotiView>
    );

    // Renderizar a lista de tipos de treino
    const renderWorkoutTypesList = () => (
      <View style={styles.workoutTypesList}>
        {Array.isArray(availableWorkoutTypes) &&
        availableWorkoutTypes.length > 0 ? (
          availableWorkoutTypes.map((item) => (
            <Swipeable
              key={item.id}
              renderRightActions={
                item.isDefault ? undefined : () => renderRightActions(item)
              }
              friction={2}
              overshootRight={false}
            >
              <MotiView
                style={styles.workoutCardWrapper}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 300,
                  easing: Easing.out(Easing.ease),
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.workoutItem,
                    { backgroundColor: colors.card },
                    item.selected && {
                      backgroundColor: item.color + "08",
                      borderWidth: 1,
                      borderColor: item.color + "30",
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleWorkoutSelection(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.workoutContent,
                      item.selected && { backgroundColor: "transparent" },
                    ]}
                  >
                    <View style={styles.workoutIconContainer}>
                      <WorkoutIcon
                        iconType={item.iconType}
                        size={24}
                        color={item.selected ? item.color : colors.primary}
                      />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text
                        style={[styles.workoutName, { color: colors.text }]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.workoutActions}>
                      <TouchableOpacity
                        style={[
                          styles.editButton,
                          { backgroundColor: item.color + "20" },
                        ]}
                        onPress={() => startEditingWorkout(item)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={item.color}
                        />
                      </TouchableOpacity>
                      <View style={styles.workoutSelection}>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: item.selected
                                ? item.color
                                : colors.border,
                              backgroundColor: item.selected
                                ? item.color
                                : "transparent",
                            },
                          ]}
                        >
                          {item.selected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            </Swipeable>
          ))
        ) : (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            Nenhum tipo de treino disponível
          </Text>
        )}
      </View>
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={["70%"]}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "50" }}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Configurar Treinos
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              Selecione e personalize seus treinos
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isAddingCustomWorkout
              ? renderCustomWorkoutForm()
              : renderWorkoutTypesList()}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.saveConfigButton,
                { backgroundColor: colors.primary },
                !availableWorkoutTypes.some((w) => w.selected) &&
                  styles.saveConfigButtonDisabled,
              ]}
              onPress={handleSaveWorkoutTypes}
              disabled={!availableWorkoutTypes.some((w) => w.selected)}
            >
              <Text style={styles.saveConfigButtonText}>
                Salvar Configuração
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "bold",
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
    fontSize: 16,
    fontWeight: "600",
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
  workoutCardWrapper: {},
  workoutItem: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  workoutContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 80,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutSelection: {
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  customWorkoutContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
    marginVertical: 16,
  },
  colorSelectorContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },
  colorSelector: {
    marginBottom: 16,
  },
  colorList: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: "#FFF",
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  iconSelectorContainer: {
    marginBottom: 16,
  },
  iconSelector: {
    marginBottom: 16,
  },
  iconList: {
    flexDirection: "row",
    marginTop: 8,
    paddingVertical: 4,
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
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  saveButtonIcon: {
    marginLeft: 8,
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
  deleteActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 12,
  },
  deleteAction: {
    padding: 8,
    borderRadius: 8,
  },
  workoutTypesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  addCustomWorkoutCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  addCustomWorkoutContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  addCustomWorkoutIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addCustomWorkoutInfo: {
    flex: 1,
  },
  addCustomWorkoutTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  addCustomWorkoutSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  addCustomWorkoutArrow: {
    marginLeft: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  workoutActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 60,
    marginTop: 8,
    fontWeight: "500",
  },
});
