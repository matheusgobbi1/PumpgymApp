import React, {
  forwardRef,
  useCallback,
  useState,
  useEffect,
  ForwardedRef,
  useRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";

import { MotiView } from "moti";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";
import { useAuth } from "../../context/AuthContext";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import ButtonNew from "../common/ButtonNew";
import { useTranslation } from "react-i18next";
import { OfflineStorage } from "../../services/OfflineStorage";

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
    name: "Workout A",
    iconType: {
      type: "material" as const,
      name: "arm-flex-outline" as MaterialIconNames,
    },
    color: "#FF6B6B",
    selected: false,
    isDefault: true,
  },
  {
    id: "Treino B",
    name: "Workout B",
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
    name: "Workout C",
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
    name: "Workout D",
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
    name: "Workout E",
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
    name: "Workout F",
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
    name: "Workout G",
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
  onDismiss?: () => void; // Callback quando o bottom sheet for fechado
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
    { onWorkoutConfigured, selectedDate, onDismiss },
    ref: ForwardedRef<BottomSheetModal>
  ) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const userId = user?.uid || "anonymous";
    const { theme } = useTheme();
    const colors = Colors[theme];
    const {
      updateWorkoutTypes,
      saveAvailableWorkoutTypes,
      getAvailableWorkoutTypes,
    } = useWorkoutContext();

    // Referência interna para o bottom sheet
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Referência para o ScrollView
    const scrollViewRef = useRef<ScrollView>(null);

    // Referência para manter controle de qual item está sendo editado e sua posição
    const editingItemRef = useRef<{ id: string; index: number } | null>(null);

    // Estado para controlar os snapPoints do BottomSheet
    const [snapPoints, setSnapPoints] = useState<(string | number)[]>(["70%"]);

    // Expor a referência para o componente pai
    useImperativeHandle(ref, () => {
      return bottomSheetModalRef.current!;
    });

    // Estados
    const [availableWorkoutTypes, setAvailableWorkoutTypes] = useState<
      WorkoutType[]
    >(DEFAULT_WORKOUT_TYPES);

    // Estado para controlar qual treino está sendo editado
    const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(
      null
    );
    const [editingWorkoutName, setEditingWorkoutName] = useState("");

    // Estado para controlar seletores de cores e ícones para edição inline
    const [showColorSelector, setShowColorSelector] = useState(false);
    const [showIconSelector, setShowIconSelector] = useState(false);
    const [selectedWorkoutForOptions, setSelectedWorkoutForOptions] = useState<
      string | null
    >(null);

    // Carregar tipos de treino disponíveis do AsyncStorage
    useEffect(() => {
      const loadWorkoutTypes = async () => {
        try {
          const storedTypes = await AsyncStorage.getItem(
            `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
          );

          if (storedTypes) {
            const parsedTypes = JSON.parse(storedTypes);

            if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
              setAvailableWorkoutTypes(parsedTypes);
              return;
            }
          }

          // Fallback para os tipos do contexto
          const contextTypes = getAvailableWorkoutTypes();
          if (Array.isArray(contextTypes) && contextTypes.length > 0) {
            setAvailableWorkoutTypes(contextTypes);
            return;
          }

          // Se não há dados salvos nem no contexto, usar os padrões
          setAvailableWorkoutTypes(DEFAULT_WORKOUT_TYPES);
        } catch (error) {
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
    }, []);

    // Iniciar edição inline
    const startEditingWorkout = (workout: WorkoutType, index: number) => {
      setEditingWorkoutId(workout.id);
      setEditingWorkoutName(workout.name);
      setSelectedWorkoutForOptions(workout.id);

      // Armazenar referência de qual item está sendo editado e sua posição
      editingItemRef.current = { id: workout.id, index };

      // Ajustar o snapPoint para dar mais espaço quando o teclado estiver aberto
      // Aumentar para 90% para garantir mais espaço para os itens inferiores
      setSnapPoints(["90%"]);

      // Calcular a posição de rolagem considerando a posição do item na lista
      // Quanto mais abaixo estiver o item, mais para cima devemos rolar
      setTimeout(() => {
        const itemHeight = 80; // Altura aproximada de cada item
        // Para itens no começo da lista, rolamos menos
        // Para itens no final da lista, rolamos mais
        const baseOffset = index * itemHeight;

        // Calculamos um offset progressivo - quanto maior o índice, mais alto rolamos
        // Esta fórmula aumenta progressivamente o offset com base no índice
        const progressiveOffset = Math.max(0, index > 2 ? (index - 2) * 50 : 0);

        scrollViewRef.current?.scrollTo({
          y: baseOffset + progressiveOffset,
          animated: true,
        });
      }, 100);

      // Feedback tátil
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Salvar a edição do nome do treino
    const saveWorkoutNameEdit = (workoutId: string) => {
      if (editingWorkoutName.trim() === "") {
        Alert.alert("Erro", t("workouts.configSheet.workoutNameError"));
        return;
      }

      setAvailableWorkoutTypes((prevWorkoutTypes) => {
        return prevWorkoutTypes.map((wt) => {
          if (wt.id === workoutId) {
            return { ...wt, name: editingWorkoutName };
          }
          return wt;
        });
      });

      // Restaurar o snapPoint original após salvar
      setSnapPoints(["70%"]);
      setEditingWorkoutId(null);
      Keyboard.dismiss();
    };

    // Atualizar cor do treino
    const updateWorkoutColor = (workoutId: string, color: string) => {
      setAvailableWorkoutTypes((prevWorkoutTypes) => {
        return prevWorkoutTypes.map((wt) => {
          if (wt.id === workoutId) {
            return { ...wt, color };
          }
          return wt;
        });
      });
    };

    // Atualizar ícone do treino
    const updateWorkoutIcon = (
      workoutId: string,
      iconType: WorkoutIconType
    ) => {
      setAvailableWorkoutTypes((prevWorkoutTypes) => {
        return prevWorkoutTypes.map((wt) => {
          if (wt.id === workoutId) {
            return { ...wt, iconType };
          }
          return wt;
        });
      });
    };

    // Cancelar edição do nome
    const cancelWorkoutNameEdit = () => {
      // Restaurar o snapPoint original ao cancelar
      setSnapPoints(["70%"]);
      setEditingWorkoutId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Alternar seletor de cores
    const toggleColorSelector = (workoutId: string) => {
      setSelectedWorkoutForOptions(workoutId);
      setShowColorSelector(!showColorSelector);
      setShowIconSelector(false);
    };

    // Alternar seletor de ícones
    const toggleIconSelector = (workoutId: string) => {
      setSelectedWorkoutForOptions(workoutId);
      setShowIconSelector(!showIconSelector);
      setShowColorSelector(false);
    };

    // Função para deletar treino
    const renderRightActions = useCallback(
      (workout: WorkoutType) => {
        return (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={() => {
              Alert.alert(
                t("workouts.configSheet.deleteConfirmTitle"),
                t("workouts.configSheet.deleteConfirmMessage", {
                  name: workout.name,
                }),
                [
                  {
                    text: t("workouts.configSheet.cancelDeleteButton"),
                    style: "cancel",
                  },
                  {
                    text: t("workouts.configSheet.deleteButton"),
                    style: "destructive",
                    onPress: () => {
                      setAvailableWorkoutTypes((prevWorkoutTypes) => {
                        const updatedWorkoutTypes = prevWorkoutTypes.filter(
                          (wt) => wt.id !== workout.id
                        );
                        return updatedWorkoutTypes;
                      });
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        );
      },
      [colors.danger, t]
    );

    const handleSaveWorkoutTypes = async () => {
      // Obter os tipos de treino selecionados
      const selectedWorkoutTypes = availableWorkoutTypes.filter(
        (w) => w.selected
      );

      // Verificar se há treinos selecionados
      if (selectedWorkoutTypes.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Fornecer feedback tátil de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Notificar que a configuração foi concluída
      onWorkoutConfigured?.(selectedWorkoutTypes);

      // Fechar o modal com um pequeno atraso para garantir que o feedback seja percebido
      setTimeout(() => {
        if (bottomSheetModalRef.current) {
          bottomSheetModalRef.current.dismiss();
        }
      }, 50);

      // Executar as operações assíncronas em segundo plano após fechar o modal
      setTimeout(async () => {
        try {
          // Salvar localmente
          await saveAvailableWorkoutTypes(availableWorkoutTypes);

          // Atualizar o contexto
          updateWorkoutTypes(availableWorkoutTypes);

          // Verificar conexão online antes de tentar sincronizar com Firebase
          const isOnline = await OfflineStorage.isOnline();

          // Sincronizar com Firebase apenas se estiver online e o usuário não for anônimo
          if (isOnline && user && !user.isAnonymous) {
            try {
              const db = getFirestore();
              const workoutsRef = doc(
                db,
                "users",
                user.uid,
                "workouts",
                "data"
              );

              await setDoc(
                workoutsRef,
                {
                  availableWorkoutTypes: availableWorkoutTypes,
                  lastUpdated: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (firebaseError) {
              // Erro ao sincronizar tipos de treino com Firebase
            }
          }
        } catch (error) {
          // Erro ao salvar tipos de treino
        }
      }, 100);
    };

    // Função para quando o bottom sheet for fechado
    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        // Apenas fechamos o modal sem criar treinos
        // O usuário precisa explicitamente clicar em "Salvar" para criar os treinos
      }
    }, []);

    // Função para obter a cor do treino selecionado
    // Se houver múltiplos treinos selecionados, usamos a cor do último treino selecionado
    const getSelectedWorkoutColor = useCallback(() => {
      const selectedWorkouts = availableWorkoutTypes.filter((w) => w.selected);

      if (selectedWorkouts.length === 0) {
        return undefined;
      }

      // Retorna a cor do último treino selecionado
      return selectedWorkouts[selectedWorkouts.length - 1].color;
    }, [availableWorkoutTypes]);

    // Verifica se há múltiplos treinos selecionados
    const hasMultipleWorkoutsSelected = useCallback(() => {
      return availableWorkoutTypes.filter((w) => w.selected).length > 1;
    }, [availableWorkoutTypes]);

    // Função para obter todas as cores dos treinos selecionados
    const getSelectedWorkoutColors = useCallback(() => {
      return availableWorkoutTypes
        .filter((w) => w.selected)
        .map((w) => w.color);
    }, [availableWorkoutTypes]);

    // Função para renderizar os indicadores de cor
    const renderColorIndicators = () => {
      const selectedColors = getSelectedWorkoutColors();

      if (selectedColors.length === 0) return null;

      // Limitar o número de indicadores para não sobrecarregar a UI
      const maxIndicators = 4;
      const colorsToShow = selectedColors.slice(0, maxIndicators);
      const hasMore = selectedColors.length > maxIndicators;

      return (
        <View style={styles.colorIndicatorsContainer}>
          {colorsToShow.map((color, index) => (
            <View
              key={`color-${index}`}
              style={[
                styles.colorIndicator,
                {
                  backgroundColor: color,
                  // Um pequeno efeito de escalonamento para os círculos
                  transform: [{ scale: 1 - index * 0.05 }],
                  zIndex: colorsToShow.length - index,
                  marginLeft: index > 0 ? -6 : 0, // Sobreposição parcial
                },
              ]}
            />
          ))}
          {hasMore && (
            <View
              style={[
                styles.colorIndicatorMore,
                { backgroundColor: colors.text + "30" },
              ]}
            >
              <Text
                style={[styles.colorIndicatorMoreText, { color: colors.text }]}
              >
                +{selectedColors.length - maxIndicators}
              </Text>
            </View>
          )}
        </View>
      );
    };

    // Função para renderizar o backdrop (fundo escurecido)
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    // Renderizar a lista de tipos de treino
    const renderWorkoutTypesList = () => (
      <View style={styles.workoutTypesList}>
        {Array.isArray(availableWorkoutTypes) &&
        availableWorkoutTypes.length > 0 ? (
          availableWorkoutTypes.map((item, index) => (
            <Swipeable
              key={item.id}
              renderRightActions={
                item.isDefault ? undefined : () => renderRightActions(item)
              }
              friction={2}
              overshootRight={false}
              enabled={editingWorkoutId !== item.id} // Desativar swipe durante edição
            >
              <MotiView
                style={styles.workoutCardWrapper}
                from={{
                  opacity: 0,
                  translateY: 50,
                  translateX: (index % 2 === 0 ? -1 : 1) * 20,
                  scale: 0.9,
                  rotate: `${(index % 2 === 0 ? -1 : 1) * 5}deg`,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                  translateX: 0,
                  scale: 1,
                  rotate: "0deg",
                }}
                transition={{
                  type: "spring",
                  delay: index * 100,
                  damping: 15,
                  mass: 0.8,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.workoutItem,
                    { backgroundColor: colors.card },
                    item.selected && {
                      backgroundColor: item.color + "15",
                      borderWidth: 1,
                      borderColor: item.color + "50",
                    },
                  ]}
                  onPress={() => {
                    if (editingWorkoutId === null) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleWorkoutSelection(item);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={editingWorkoutId !== null}
                >
                  <View
                    style={[
                      styles.workoutContent,
                      item.selected && { backgroundColor: "transparent" },
                    ]}
                  >
                    {/* Ícone do treino - clicável para edição de ícone quando em modo de edição */}
                    <TouchableOpacity
                      style={[
                        styles.workoutIconContainer,
                        {
                          backgroundColor: item.selected
                            ? item.color + "30"
                            : colors.background + "90",
                          borderWidth: 1,
                          borderColor: item.selected
                            ? item.color
                            : colors.border + "40",
                        },
                      ]}
                      onPress={() => {
                        if (editingWorkoutId === item.id) {
                          toggleIconSelector(item.id);
                        }
                      }}
                      disabled={editingWorkoutId !== item.id}
                    >
                      <WorkoutIcon
                        iconType={item.iconType}
                        size={24}
                        color={item.selected ? item.color : colors.primary}
                      />
                    </TouchableOpacity>

                    {/* Área de nome e edição */}
                    <View style={styles.workoutInfo}>
                      {editingWorkoutId === item.id ? (
                        <View style={styles.inlineEditContainer}>
                          <TextInput
                            style={[
                              styles.inlineTextInput,
                              {
                                color: colors.text,
                                borderColor: item.color,
                                backgroundColor: colors.background + "40",
                              },
                            ]}
                            value={editingWorkoutName}
                            onChangeText={setEditingWorkoutName}
                            autoFocus
                            selectTextOnFocus
                            onBlur={() => cancelWorkoutNameEdit()}
                            onFocus={() => {
                              // Se o item for um dos últimos da lista, garantir que ele seja bem visível
                              if (index > 3) {
                                // Rolar mais para cima para itens mais abaixo na lista
                                const adjustedOffset =
                                  index * 80 + (index - 3) * 60;
                                scrollViewRef.current?.scrollTo({
                                  y: adjustedOffset,
                                  animated: true,
                                });
                              }
                            }}
                            onSubmitEditing={() => saveWorkoutNameEdit(item.id)}
                            maxLength={20}
                          />
                          <TouchableOpacity
                            style={styles.inlineEditButton}
                            onPress={() => saveWorkoutNameEdit(item.id)}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={item.color}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.inlineEditButton}
                            onPress={cancelWorkoutNameEdit}
                          >
                            <Ionicons
                              name="close-circle"
                              size={24}
                              color={colors.text + "70"}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.workoutName,
                            {
                              color: colors.text,
                              fontWeight: item.selected ? "700" : "600",
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                      )}
                    </View>

                    {/* Ações de edição */}
                    {editingWorkoutId === item.id ? (
                      <TouchableOpacity
                        style={[
                          styles.colorPickerButton,
                          { backgroundColor: item.color + "20" },
                        ]}
                        onPress={() => toggleColorSelector(item.id)}
                      >
                        <View
                          style={[
                            styles.colorPreview,
                            { backgroundColor: item.color },
                          ]}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => startEditingWorkout(item, index)}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={colors.text + "70"}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Seletor de cores inline */}
                  {showColorSelector &&
                    selectedWorkoutForOptions === item.id && (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 200,
                        }}
                        style={styles.inlineColorSelector}
                      >
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.inlineColorList}
                        >
                          {AVAILABLE_COLORS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                item.color === color &&
                                  styles.colorOptionSelected,
                              ]}
                              onPress={() => {
                                updateWorkoutColor(item.id, color);
                                setShowColorSelector(false);
                              }}
                            >
                              {item.color === color && (
                                <Ionicons
                                  name="checkmark"
                                  size={18}
                                  color="#FFF"
                                />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </MotiView>
                    )}

                  {/* Seletor de ícones inline */}
                  {showIconSelector &&
                    selectedWorkoutForOptions === item.id && (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 200,
                        }}
                        style={styles.inlineIconSelector}
                      >
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.inlineIconList}
                        >
                          {AVAILABLE_ICONS.map((icon, index) => (
                            <TouchableOpacity
                              key={`${icon.type}-${icon.name}-${index}`}
                              style={[
                                styles.iconOption,
                                {
                                  backgroundColor:
                                    item.iconType.type === icon.type &&
                                    item.iconType.name === icon.name
                                      ? item.color
                                      : colors.background,
                                  borderColor:
                                    item.iconType.type === icon.type &&
                                    item.iconType.name === icon.name
                                      ? item.color
                                      : colors.border,
                                  borderWidth: 2,
                                  width: 42,
                                  height: 42,
                                },
                              ]}
                              onPress={() => {
                                updateWorkoutIcon(item.id, icon);
                                setShowIconSelector(false);
                              }}
                            >
                              <WorkoutIcon
                                iconType={icon}
                                size={22}
                                color={
                                  item.iconType.type === icon.type &&
                                  item.iconType.name === icon.name
                                    ? "#FFF"
                                    : colors.text + "80"
                                }
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </MotiView>
                    )}
                </TouchableOpacity>
              </MotiView>
            </Swipeable>
          ))
        ) : (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            {t("workouts.configSheet.noWorkouts")}
          </Text>
        )}
      </View>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "50" }}
        onDismiss={onDismiss}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("workouts.configSheet.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              {t("workouts.configSheet.subtitle")}
            </Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContentContainer,
              // Adicionar espaço extra no final do conteúdo para garantir
              // que todos os itens possam ser rolados até a visualização completa
              { paddingBottom: 240 },
            ]}
          >
            {renderWorkoutTypesList()}
          </ScrollView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay: 300 }}
            style={[styles.footer, { borderTopColor: colors.border }]}
          >
            <MotiView
              animate={{
                scale: availableWorkoutTypes.some((w) => w.selected) ? 1 : 0.95,
                opacity: availableWorkoutTypes.some((w) => w.selected)
                  ? 1
                  : 0.7,
              }}
              transition={{
                type: "spring",
                damping: 15,
              }}
            >
              <ButtonNew
                title={t("workouts.configSheet.saveButton")}
                onPress={handleSaveWorkoutTypes}
                variant="primary"
                disabled={
                  !availableWorkoutTypes.some((w) => w.selected) ||
                  editingWorkoutId !== null
                }
                style={
                  getSelectedWorkoutColor()
                    ? {
                        ...styles.saveConfigButton,
                        backgroundColor: getSelectedWorkoutColor(),
                      }
                    : styles.saveConfigButton
                }
                textStyle={{
                  ...styles.saveConfigButtonText,
                  color: theme === "dark" ? "#000000" : "#FFFFFF",
                  fontWeight: "700",
                }}
                hapticFeedback="notification"
                size="large"
                rounded={true}
                elevation={0}
                leftComponent={renderColorIndicators()}
              />
            </MotiView>
          </MotiView>
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 27,
    borderTopWidth: 1,
    paddingBottom: 35,
  },
  saveConfigButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  saveConfigButtonDisabled: {
    opacity: 0.5,
  },
  saveConfigButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
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
    minHeight: 70,
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
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  selectedText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  editButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 240,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  workoutTypesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    marginBottom: 12,
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
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 12,
  },
  // Estilos para edição inline
  inlineEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  inlineTextInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginRight: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  inlineEditButton: {
    padding: 4,
    marginLeft: 4,
  },
  colorPickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "white",
  },
  inlineColorSelector: {
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  inlineIconSelector: {
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  inlineColorList: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  inlineIconList: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  // Estilos para os indicadores de cor
  colorIndicatorsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "white",
  },
  colorIndicatorMore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  colorIndicatorMoreText: {
    fontSize: 9,
    fontWeight: "bold",
  },
});
