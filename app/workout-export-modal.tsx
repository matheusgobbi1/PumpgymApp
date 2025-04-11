import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PixelRatio,
  Dimensions,
  AppState,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import {
  useWorkoutContext,
  Exercise,
  ExerciseSet,
} from "../context/WorkoutContext";
import { useAuth } from "../context/AuthContext";
import ViewShot from "react-native-view-shot";
import * as ExpoSharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "../hooks/useDateLocale";
import { getLocalDate } from "../utils/dateUtils";
import { LinearGradient } from "expo-linear-gradient";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";

// Tipos para o modal de exportação de treino
type ExportPeriod = "day" | "week";

// Definindo tipos para o componente
interface WorkoutExportProps {
  // Props específicas se necessário
}

export default function WorkoutExportModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { formatDateWithWeekday } = useDateLocale();
  const viewShotRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedMessage, setSharedMessage] = useState("");
  const { user } = useAuth();
  const { width: screenWidth } = Dimensions.get("window");
  const pixelRatio = PixelRatio.get();
  const [exportOption, setExportOption] = useState<"image" | "pdf">("image");
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>("day");
  // Para controlar se o compartilhamento foi cancelado pelo usuário
  const isSharingCanceledRef = useRef(false);

  // Nome do usuário usando o mesmo formato do HomeHeader
  const userName = useMemo(() => {
    return user?.displayName?.split(" ")[0] || t("common.user");
  }, [user?.displayName, t]);

  const {
    selectedDate,
    workoutsForSelectedDate,
    getWorkoutTypeById,
    getExercisesForWorkout,
    getWorkoutTotals,
    getWorkoutsForDate,
    workouts,
  } = useWorkoutContext();

  // Formatar a data para exibição
  const formattedDate = formatDateWithWeekday(getLocalDate(selectedDate));
  // Formatar apenas o mês
  const formattedMonth = format(getLocalDate(selectedDate), "MMMM yyyy");

  // Função para calcular o período da semana para exportação
  const weekInterval = useMemo(() => {
    const currentDate = getLocalDate(selectedDate);
    const firstDayOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const lastDayOfWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

    // Calcular dias da semana manualmente
    const days = [];
    let current = new Date(firstDayOfWeek);
    while (current <= lastDayOfWeek) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      start: firstDayOfWeek,
      end: lastDayOfWeek,
      days: days,
    };
  }, [selectedDate]);

  // Formatação para exibição do período da semana
  const weekPeriodDisplay = useMemo(() => {
    const startFormatted = format(weekInterval.start, "dd/MM");
    const endFormatted = format(weekInterval.end, "dd/MM/yyyy");
    return `${startFormatted} - ${endFormatted}`;
  }, [weekInterval]);

  // Função para formatar números com no máximo 1 casa decimal
  const formatNumber = (value: number): string => {
    return value.toFixed(1).replace(/\.0$/, "");
  };

  // Dados memoizados dos treinos para a data selecionada
  const workoutData = useMemo(() => {
    if (
      !workoutsForSelectedDate ||
      Object.keys(workoutsForSelectedDate).length === 0
    ) {
      return [];
    }

    return Object.keys(workoutsForSelectedDate)
      .map((workoutId) => {
        const workoutType = getWorkoutTypeById(workoutId);
        if (!workoutType) return null;

        const exercises = getExercisesForWorkout(workoutId);
        const workoutTotals = getWorkoutTotals(workoutId);

        return {
          id: workoutId,
          type: workoutType,
          exercises,
          totals: workoutTotals,
        };
      })
      .filter(Boolean);
  }, [
    workoutsForSelectedDate,
    getWorkoutTypeById,
    getExercisesForWorkout,
    getWorkoutTotals,
  ]);

  // Obter dados de treinos para a semana atual
  const weekWorkoutData = useMemo(() => {
    const currentDate = getLocalDate(selectedDate);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo

    // Gerar array com todos os dias da semana
    const daysOfWeek = [];
    let current = new Date(weekStart);
    while (current <= weekEnd) {
      daysOfWeek.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Mapear cada dia para seus dados de treino
    return daysOfWeek.map((day) => {
      const dateString = format(day, "yyyy-MM-dd");
      const workoutsForDay = getWorkoutsForDate(dateString);

      // Se não houver treinos para este dia, retornar objeto com data e array vazio
      if (Object.keys(workoutsForDay).length === 0) {
        return {
          date: day,
          formattedDate: formatDateWithWeekday(day),
          workouts: [],
        };
      }

      // Mapear cada treino do dia
      const dayWorkouts = Object.keys(workoutsForDay)
        .map((workoutId) => {
          const workoutType = getWorkoutTypeById(workoutId);
          if (!workoutType) return null;

          // Obter exercícios e totais específicos para esta data
          const dateExercises = workoutsForDay[workoutId];

          // Calcular totais específicos para este treino nesta data
          // Note: isso é uma simplificação, você pode precisar adaptar com base em como seus totais são calculados
          let totalSets = 0;
          let totalVolume = 0;

          dateExercises.forEach((exercise) => {
            if (exercise.sets) {
              totalSets += exercise.sets.length;
              exercise.sets.forEach((set) => {
                totalVolume += set.weight * set.reps;
              });
            }
          });

          return {
            id: workoutId,
            type: workoutType,
            exercises: dateExercises,
            totals: {
              totalExercises: dateExercises.length,
              totalSets,
              totalVolume,
            },
          };
        })
        .filter(Boolean);

      return {
        date: day,
        formattedDate: formatDateWithWeekday(day),
        workouts: dayWorkouts,
      };
    });
  }, [
    selectedDate,
    getWorkoutsForDate,
    getWorkoutTypeById,
    formatDateWithWeekday,
  ]);

  // Função para verificar permissões de arquivo (diagnóstico)
  const checkFilePermissions = async (path: string) => {
    try {
      const info = await FileSystem.getInfoAsync(path);
      console.log(`Verificação de arquivo: ${path}`);
      console.log(`- Existe: ${info.exists}`);
      if (info.exists) {
        console.log(`- Tamanho: ${info.size} bytes`);
        console.log(`- URI: ${info.uri}`);
      }
      return info.uri || path;
    } catch (error: any) {
      console.error(`Erro ao verificar arquivo ${path}:`, error.message);
      return path;
    }
  };

  // Função para mostrar o modal de opções de exportação
  const showExportOptions = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (Platform.OS === "ios") {
        // Em iOS, mostrar um ActionSheet
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [
              t("training.export.pdfFormat") || "Documento (PDF)",
              t("training.export.imageFormat") || "Imagem (PNG)",
              t("common.cancel") || "Cancelar",
            ],
            cancelButtonIndex: 2,
            title: t("training.export.chooseFormat") || "Escolha o formato",
            message:
              t("training.export.formatDescription") ||
              "Escolha o formato para exportar seu treino.",
            userInterfaceStyle: theme,
          },
          async (buttonIndex) => {
            if (buttonIndex === 0) {
              // PDF escolhido
              handleShare("pdf");
            } else if (buttonIndex === 1) {
              // Imagem escolhida
              handleShare("image");
            }
          }
        );
      } else {
        // Em Android, mostrar um Modal ou Popover
        Alert.alert(
          t("training.export.chooseFormat") || "Escolha o formato",
          t("training.export.formatDescription") ||
            "Escolha o formato para exportar seu treino.",
          [
            {
              text: t("training.export.pdfFormat") || "Documento (PDF)",
              onPress: () => handleShare("pdf"),
            },
            {
              text: t("training.export.imageFormat") || "Imagem (PNG)",
              onPress: () => handleShare("image"),
            },
            {
              text: t("common.cancel") || "Cancelar",
              style: "cancel",
            },
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao mostrar opções de exportação:", error);
    }
  };

  // Função para compartilhar a captura de tela
  const handleShare = async (type: "pdf" | "image") => {
    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (type === "pdf") {
        // Gerar HTML
        const htmlContent = generateHtmlContent();

        // Gerar PDF
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          width: 612,
          height: 792,
        });

        console.log("PDF gerado:", uri);
        let realPath = uri;

        // Em algumas plataformas, precisamos verificar a permissão
        if (Platform.OS === "android") {
          realPath = await checkFilePermissions(uri);
        }

        // Compartilhar o PDF
        const result = await ExpoSharing.shareAsync(realPath, {
          mimeType: "application/pdf",
          dialogTitle: t("training.export.shareTitle") || "Meu treino FitFolio",
          UTI: "com.adobe.pdf",
        });

        console.log("Resultado do compartilhamento:", result);

        // Verificar se o compartilhamento foi concluído
        if (result === null && Platform.OS === "ios") {
          console.log("Compartilhamento concluído (iOS)");
          setSharedMessage(
            t("training.export.shareSuccess") ||
              "Treino compartilhado com sucesso!"
          );
          setTimeout(() => setSharedMessage(""), 3000);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          console.log("Compartilhamento concluído com sucesso");
          setSharedMessage(
            t("training.export.shareSuccess") ||
              "Treino compartilhado com sucesso!"
          );
          setTimeout(() => setSharedMessage(""), 3000);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (type === "image") {
        // Capturar o conteúdo como imagem
        if (!viewShotRef.current) {
          throw new Error("ViewShot ref não está disponível");
        }

        const uri = await viewShotRef.current.capture();
        console.log("Imagem capturada:", uri);

        let realPath = uri;

        // Em algumas plataformas, precisamos verificar a permissão
        if (Platform.OS === "android") {
          realPath = await checkFilePermissions(uri);
        }

        // Compartilhar a imagem
        const result = await ExpoSharing.shareAsync(realPath, {
          mimeType: "image/png",
          dialogTitle: t("training.export.shareTitle") || "Meu treino FitFolio",
          UTI: "public.png",
        });

        console.log("Resultado do compartilhamento:", result);

        // Verificar se o compartilhamento foi concluído
        if (result === null && Platform.OS === "ios") {
          console.log("Compartilhamento concluído (iOS)");
          setSharedMessage(
            t("training.export.shareSuccess") ||
              "Treino compartilhado com sucesso!"
          );
          setTimeout(() => setSharedMessage(""), 3000);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          console.log("Compartilhamento concluído com sucesso");
          setSharedMessage(
            t("training.export.shareSuccess") ||
              "Treino compartilhado com sucesso!"
          );
          setTimeout(() => setSharedMessage(""), 3000);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      Alert.alert(
        t("common.error"),
        t("training.export.shareError") ||
          "Não foi possível compartilhar o treino. Tente novamente."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSharing(false);
    }
  };

  // Função para gerar HTML do plano de treino
  const generateHtmlContent = () => {
    // Destructure colors
    const {
      background: backgroundColor,
      card: cardColor,
      primary: primaryColor,
      text: textColor,
      border: borderColor,
      light,
      secondary: secondaryTextColor,
    } = colors;

    // Adicionar horário formatado para exibição
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Função para gerar HTML para treinos de um único dia
    const generateDayHTML = () => {
      // Verificar se workoutData está vazio
      if (!workoutData || workoutData.length === 0) {
        return `
          <div style="padding: 24px; text-align: center;">
            <div style="font-size: 16px; color: ${secondaryTextColor};">
              ${
                t("training.export.noWorkoutsDay") ||
                "Não há treinos registrados para este dia."
              }
            </div>
          </div>
        `;
      }

      // Gerar HTML para cada treino
      return workoutData
        .map((workout) => {
          if (!workout) return "";

          // Gerar estatísticas
          const statsHTML = `
          <div style="display: flex; justify-content: space-around; text-align: center; padding: 16px; background-color: ${cardColor}; border-radius: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">
                ${workout.totals.totalExercises}
              </div>
              <div style="font-size: 12px; color: ${secondaryTextColor};">
                ${t("training.stats.exercises") || "Exercícios"}
              </div>
            </div>
            
            <div style="width: 1px; height: 40px; background-color: ${borderColor}30;"></div>
            
            <div>
              <div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">
                ${workout.totals.totalSets}
              </div>
              <div style="font-size: 12px; color: ${secondaryTextColor};">
                ${t("training.stats.sets") || "Séries"}
              </div>
            </div>
            
            <div style="width: 1px; height: 40px; background-color: ${borderColor}30;"></div>
            
            <div>
              <div style="font-size: 24px; font-weight: 700; color: ${primaryColor};">
                ${formatNumber(workout.totals.totalVolume)}
              </div>
              <div style="font-size: 12px; color: ${secondaryTextColor};">
                ${t("training.stats.volume") || "Volume"}
              </div>
            </div>
          </div>
        `;

          // Gerar lista de exercícios
          const exercisesListHTML = workout.exercises
            .map((exercise) => {
              // Se não houver séries, exibir apenas o nome do exercício
              if (!exercise.sets || exercise.sets.length === 0) {
                return `
                <div style="padding: 14px; background-color: ${backgroundColor}; border-radius: 12px; margin-bottom: 12px; border: 1px solid ${borderColor}20;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 28px; height: 28px; border-radius: 14px; background-color: ${
                      workout.type.color
                    }20; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${
                        workout.type.color
                      }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                        <line x1="16" y1="8" x2="2" y2="22"></line>
                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                      </svg>
                    </div>
                    <div style="font-size: 16px; font-weight: 500; color: ${textColor};">
                      ${exercise.name}
                    </div>
                  </div>
                  <div style="margin-top: 10px; font-size: 14px; color: ${secondaryTextColor}; text-align: center; font-style: italic;">
                    ${t("exercise.noSets") || "Sem séries registradas"}
                  </div>
                </div>
              `;
              }

              // Gerar séries para o exercício
              const setsHTML = exercise.sets
                .map(
                  (set, index) => `
                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background-color: ${backgroundColor}; border-radius: 6px; margin-bottom: 8px; border: 1px solid ${borderColor}10;">
                  <div style="font-size: 14px; color: ${secondaryTextColor};">
                    ${t("exercise.setNumber") || "Série"} ${index + 1}
                  </div>
                  <div style="font-size: 14px; font-weight: 500; color: ${textColor};">
                    ${set.weight} kg × ${set.reps} ${
                    t("exercise.reps") || "reps"
                  }
                  </div>
                </div>
              `
                )
                .join("");

              // HTML para o exercício
              return `
              <div style="padding: 14px; background-color: ${backgroundColor}; border-radius: 12px; margin-bottom: 12px; border: 1px solid ${borderColor}20;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 28px; height: 28px; border-radius: 14px; background-color: ${
                    workout.type.color
                  }20; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${
                      workout.type.color
                    }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                      <line x1="16" y1="8" x2="2" y2="22"></line>
                      <line x1="17.5" y1="15" x2="9" y2="15"></line>
                    </svg>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: 500; color: ${textColor};">
                      ${exercise.name}
                    </div>
                    <div style="font-size: 12px; color: ${secondaryTextColor}; margin-top: 2px;">
                      ${exercise.sets.length} ${
                t("training.stats.sets") || "Séries"
              } • ${formatNumber(
                exercise.sets.reduce(
                  (total, set) => total + set.weight * set.reps,
                  0
                )
              )} ${t("training.stats.volume") || "Volume"}
                    </div>
                  </div>
                </div>
                
                <div style="margin-top: 8px;">
                  ${setsHTML}
                </div>
              </div>
            `;
            })
            .join("");

          // HTML para o treino
          return `
          <div style="background-color: ${cardColor}; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 40px; height: 40px; border-radius: 20px; background-color: ${
                workout.type.color
              }; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 18v-6m-3 0h24" />
                  <path d="M3 12h-2m20-9v18M5 8h14m-9 4v4" />
                </svg>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: 600; color: ${textColor};">
                  ${workout.type.name}
                </div>
                <div style="font-size: 14px; color: ${secondaryTextColor}; margin-top: 2px;">
                  ${formattedTime}
                </div>
              </div>
            </div>
            
            ${statsHTML}
            
            <div style="margin-top: 16px;">
              <div style="font-size: 16px; font-weight: 600; color: ${secondaryTextColor}; margin-bottom: 12px;">
                ${t("training.export.exercisesList") || "Lista de Exercícios"}:
              </div>
              ${exercisesListHTML}
            </div>
          </div>
        `;
        })
        .join("");
    };

    // Função para gerar HTML para treinos da semana
    const generateWeekHTML = () => {
      // Verificar se há treinos na semana
      const hasWorkoutsInWeek = weekWorkoutData.some(
        (day) => day.workouts.length > 0
      );

      if (!hasWorkoutsInWeek) {
        return `
          <div style="padding: 24px; text-align: center;">
            <div style="font-size: 16px; color: ${secondaryTextColor};">
              ${
                t("training.export.noWorkoutsWeek") ||
                "Não há treinos registrados para esta semana."
              }
            </div>
          </div>
        `;
      }

      return weekWorkoutData
        .map((day) => {
          // Se não houver treinos para este dia, não exibir nada
          if (day.workouts.length === 0) return "";

          // Gerar HTML para cada treino no dia
          const workoutsHTML = day.workouts
            .map((workout) => {
              if (!workout) return "";

              // Gerar resumo simplificado de estatísticas
              const statsHTML = `
            <div style="display: flex; justify-content: space-around; text-align: center; padding: 12px; background-color: ${cardColor}; border-radius: 12px; margin-bottom: 12px;">
              <div>
                <div style="font-size: 16px; font-weight: 700; color: ${primaryColor};">
                  ${workout.totals.totalExercises}
                </div>
                <div style="font-size: 11px; color: ${secondaryTextColor};">
                  ${t("training.stats.exercises") || "Exercícios"}
                </div>
              </div>
              
              <div style="width: 1px; height: 30px; background-color: ${borderColor}30;"></div>
              
              <div>
                <div style="font-size: 16px; font-weight: 700; color: ${primaryColor};">
                  ${workout.totals.totalSets}
                </div>
                <div style="font-size: 11px; color: ${secondaryTextColor};">
                  ${t("training.stats.sets") || "Séries"}
                </div>
              </div>
              
              <div style="width: 1px; height: 30px; background-color: ${borderColor}30;"></div>
              
              <div>
                <div style="font-size: 16px; font-weight: 700; color: ${primaryColor};">
                  ${formatNumber(workout.totals.totalVolume)}
                </div>
                <div style="font-size: 11px; color: ${secondaryTextColor};">
                  ${t("training.stats.volume") || "Volume"}
                </div>
              </div>
            </div>
          `;

              // Gerar lista simplificada de exercícios
              const exercisesListHTML = workout.exercises
                .map(
                  (exercise) => `
            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background-color: ${backgroundColor}; border-radius: 8px; margin-bottom: 8px; border: 1px solid ${borderColor}10;">
              <div style="display: flex; align-items: center;">
                <div style="width: 24px; height: 24px; border-radius: 12px; background-color: ${
                  workout.type.color
                }20; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${
                    workout.type.color
                  }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                </div>
                <div style="font-size: 14px; color: ${textColor};">
                  ${exercise.name}
                </div>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: ${
                workout.type.color
              };">
                ${exercise.sets ? exercise.sets.length : 0} ${
                    t("training.shortSets") || "séries"
                  }
              </div>
            </div>
          `
                )
                .join("");

              return `
            <div style="background-color: ${backgroundColor}; border-radius: 16px; padding: 16px; margin-bottom: 16px; border: 1px solid ${borderColor}30;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 16px; background-color: ${
                  workout.type.color
                }; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 18v-6m-3 0h24" />
                    <path d="M3 12h-2m20-9v18M5 8h14m-9 4v4" />
                  </svg>
                </div>
                <div style="font-size: 16px; font-weight: 700; color: ${textColor};">
                  ${workout.type.name}
                </div>
              </div>
              
              ${statsHTML}
              
              <div style="margin-top: 12px;">
                <div style="font-size: 14px; font-weight: 600; color: ${secondaryTextColor}; margin-bottom: 8px;">
                  ${t("training.exercisesList") || "Lista de Exercícios"}:
                </div>
                ${exercisesListHTML}
              </div>
            </div>
          `;
            })
            .join("");

          return `
          <div style="margin-bottom: 24px;">
            <div style="background-color: ${primaryColor}20; border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; text-align: center;">
              <div style="font-size: 16px; font-weight: 700; color: ${textColor};">
                ${day.formattedDate}
              </div>
            </div>
            
            ${workoutsHTML}
          </div>
        `;
        })
        .join("");
    };

    // Título baseado no período de exportação
    const exportTitle =
      exportPeriod === "day"
        ? `${
            t("training.export.dayTitle") || "Treino do Dia"
          } - ${formattedDate}`
        : `${
            t("training.export.weekTitle") || "Treinos da Semana"
          } - ${formattedMonth}`;

    // HTML completo para o documento
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
          <title>FitFolio - ${exportTitle}</title>
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: ${backgroundColor};
              color: ${textColor};
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding-bottom: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="padding: 24px; text-align: center; background: linear-gradient(${primaryColor}20, ${cardColor});">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 16px; background-color: ${backgroundColor}; 
              margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 16px; font-weight: 800; color: ${primaryColor};">FitFolio</div>
              </div>
              <div style="font-size: 24px; font-weight: 700; color: ${textColor}; margin: 8px 0;">
                ${userName}
              </div>
              <div style="display: inline-block; padding: 6px 12px; border-radius: 12px; background-color: ${backgroundColor}80; margin-top: 8px;">
                <div style="display: flex; align-items: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                  stroke="${secondaryTextColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div style="font-size: 14px; font-weight: 500; color: ${secondaryTextColor};">
                    ${exportPeriod === "day" ? formattedDate : formattedMonth}
                  </div>
                </div>
              </div>
            </div>

            <div style="margin: 12px;">
              <div style="font-size: 18px; font-weight: 700; color: ${textColor}; margin-bottom: 16px; text-align: center; border-bottom: 1px solid ${borderColor}30; padding-bottom: 8px;">
                ${exportTitle}
              </div>
              
              ${exportPeriod === "day" ? generateDayHTML() : generateWeekHTML()}
            </div>

            <div style="padding: 24px; background: linear-gradient(${cardColor}, ${primaryColor}20);">
              <div style="text-align: center;">
                <div style="height: 1px; width: 60px; background-color: rgba(0,0,0,0.1); margin: 0 auto 16px;"></div>
                <div style="font-size: 12px; color: ${textColor};">
                  ${t("training.export.createdWith") || "Criado com"}
                </div>
                <div style="font-size: 14px; font-weight: 700; color: ${primaryColor}; margin-top: 4px;">
                  FitFolio
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("training.export.title") || "Exportar Treino"}
          </Text>
          <View style={{ flexDirection: "row" }}>
            {isSharing ? (
              <View
                style={[
                  styles.shareButton,
                  { backgroundColor: colors.primary, opacity: 0.7 },
                ]}
              >
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.card, marginRight: 8 },
                  ]}
                  onPress={async () => {
                    try {
                      setIsSharing(true);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                      // Gerar HTML
                      const htmlContent = generateHtmlContent();

                      // Gerar PDF diretamente
                      const { uri } = await Print.printToFileAsync({
                        html: htmlContent,
                        width: 612,
                        height: 792,
                      });

                      // Abrir o PDF para visualização direta
                      console.log("Abrindo visualização de PDF");
                      await Print.printAsync({ uri });

                      // Se chegou aqui sem erro, a visualização foi concluída com sucesso
                      console.log("Visualização concluída sem erros");

                      // Exibir mensagem de sucesso
                      setSharedMessage(
                        t("training.export.viewSuccess") ||
                          "Visualização concluída"
                      );
                      setTimeout(() => setSharedMessage(""), 3000);
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );
                    } catch (error: any) {
                      console.error("Erro ao visualizar PDF:", error);

                      // Verificar se o erro é um cancelamento do usuário de forma mais abrangente
                      const errorMsg = String(
                        error?.message || ""
                      ).toLowerCase();
                      // Verificações mais abrangentes para diferentes mensagens de cancelamento
                      const wasCancelled =
                        errorMsg.includes("cancel") ||
                        errorMsg.includes("dismiss") ||
                        errorMsg.includes("user denied") ||
                        errorMsg.includes("printing did not complete") ||
                        errorMsg.includes("user cancelled") ||
                        errorMsg.includes("was cancelled") ||
                        errorMsg.includes("session completed");

                      if (!wasCancelled) {
                        // Só mostrar o alerta se não for um cancelamento
                        Alert.alert(
                          t("common.error"),
                          t("training.export.viewError") ||
                            "Não foi possível visualizar o documento"
                        );
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Error
                        );
                      } else {
                        console.log("Visualização cancelada pelo usuário");
                      }
                    } finally {
                      setIsSharing(false);
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={showExportOptions}
                  disabled={isSharing}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={theme === "dark" ? "#000" : "#fff"}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {sharedMessage ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={[
              styles.successMessage,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
            <Text
              style={[styles.successMessageText, { color: colors.primary }]}
            >
              {sharedMessage}
            </Text>
          </MotiView>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          alwaysBounceVertical={true}
          bounces={true}
          scrollEventThrottle={16}
          persistentScrollbar={true}
          overScrollMode="always"
        >
          <ViewShot
            ref={viewShotRef}
            style={[
              styles.exportContainer,
              {
                backgroundColor: colors.light,
                borderColor: colors.border,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.6 }}
              style={styles.exportHeader}
            >
              <View
                style={[styles.appBadge, { backgroundColor: colors.light }]}
              >
                <Text style={[styles.appName, { color: colors.primary }]}>
                  FitFolio
                </Text>
              </View>
              <Text style={[styles.exportTitle, { color: colors.text }]}>
                {userName}
              </Text>
              <View
                style={[
                  styles.dateContainer,
                  { backgroundColor: colors.background + "80" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.secondary}
                  style={styles.dateIcon}
                />
                <Text style={[styles.exportDate, { color: colors.secondary }]}>
                  {exportPeriod === "day" ? formattedDate : formattedMonth}
                </Text>
              </View>
            </LinearGradient>

            {/* Título do conteúdo */}
            <View style={styles.contentTitleContainer}>
              <Text style={[styles.contentTitle, { color: colors.text }]}>
                {exportPeriod === "day"
                  ? t("training.export.dayTitle") || "Treino do Dia"
                  : t("training.export.weekTitle") || "Treinos da Semana"}
              </Text>
            </View>

            {/* Conteúdo de exportação do dia */}
            {exportPeriod === "day" && (
              <View style={styles.dayContentContainer}>
                {workoutData.length === 0 ? (
                  <View
                    style={[
                      styles.emptyStateContainer,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={24}
                      color={colors.secondary}
                      style={{ marginBottom: 8 }}
                    />
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("training.export.noWorkouts") ||
                        "Não há treinos registrados para esta data"}
                    </Text>
                  </View>
                ) : (
                  workoutData.map((workout, index) => {
                    if (!workout) return null;

                    return (
                      <View key={`workout-${index}`} style={styles.workoutCard}>
                        {/* Cabeçalho do treino */}
                        <View
                          style={[
                            styles.workoutHeader,
                            { backgroundColor: colors.background },
                          ]}
                        >
                          <View style={styles.workoutTitleContainer}>
                            <View
                              style={[
                                styles.workoutIconContainer,
                                { backgroundColor: workout.type.color },
                              ]}
                            >
                              <Ionicons
                                name="barbell-outline"
                                size={18}
                                color="#fff"
                              />
                            </View>
                            <Text
                              style={[
                                styles.workoutTitle,
                                { color: colors.text },
                              ]}
                            >
                              {workout.type.name}
                            </Text>
                          </View>
                        </View>

                        {/* Stats do treino */}
                        <View
                          style={[
                            styles.statsContainer,
                            { backgroundColor: colors.card },
                          ]}
                        >
                          <View style={styles.statItem}>
                            <Text
                              style={[
                                styles.statValue,
                                { color: colors.primary },
                              ]}
                            >
                              {workout.totals.totalExercises}
                            </Text>
                            <Text
                              style={[
                                styles.statLabel,
                                { color: colors.secondary },
                              ]}
                            >
                              {t("training.stats.exercises") || "Exercícios"}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statDivider,
                              { backgroundColor: colors.border + "30" },
                            ]}
                          />

                          <View style={styles.statItem}>
                            <Text
                              style={[
                                styles.statValue,
                                { color: colors.primary },
                              ]}
                            >
                              {workout.totals.totalSets}
                            </Text>
                            <Text
                              style={[
                                styles.statLabel,
                                { color: colors.secondary },
                              ]}
                            >
                              {t("training.stats.sets") || "Séries"}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statDivider,
                              { backgroundColor: colors.border + "30" },
                            ]}
                          />

                          <View style={styles.statItem}>
                            <Text
                              style={[
                                styles.statValue,
                                { color: colors.primary },
                              ]}
                            >
                              {formatNumber(workout.totals.totalVolume)}
                            </Text>
                            <Text
                              style={[
                                styles.statLabel,
                                { color: colors.secondary },
                              ]}
                            >
                              {t("training.stats.volume") || "Volume"}
                            </Text>
                          </View>
                        </View>

                        {/* Lista de exercícios */}
                        <View style={styles.exercisesContainer}>
                          {workout.exercises.map((exercise, exerciseIndex) => (
                            <View
                              key={`exercise-${exerciseIndex}`}
                              style={[
                                styles.exerciseCard,
                                {
                                  backgroundColor: colors.background,
                                  borderColor: colors.border + "30",
                                },
                              ]}
                            >
                              <View style={styles.exerciseHeader}>
                                <View style={styles.exerciseTitleContainer}>
                                  <View
                                    style={[
                                      styles.exerciseIconContainer,
                                      {
                                        backgroundColor:
                                          workout.type.color + "20",
                                      },
                                    ]}
                                  >
                                    <MaterialCommunityIcons
                                      name="arm-flex"
                                      size={16}
                                      color={workout.type.color}
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      styles.exerciseName,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {exercise.name}
                                  </Text>
                                </View>

                                {exercise.sets && (
                                  <View style={styles.exerciseStatsContainer}>
                                    <Text
                                      style={[
                                        styles.exerciseSets,
                                        { color: workout.type.color },
                                      ]}
                                    >
                                      {exercise.sets.length}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.exerciseSetsLabel,
                                        { color: colors.secondary },
                                      ]}
                                    >
                                      {t("training.sets") || "Séries"}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {exercise.notes && (
                                <View
                                  style={[
                                    styles.exerciseNotes,
                                    { backgroundColor: colors.primary + "10" },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.exerciseNotesLabel,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {t("training.notes") || "Notas"}:
                                  </Text>
                                  <Text
                                    style={[
                                      styles.exerciseNotesText,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {exercise.notes}
                                  </Text>
                                </View>
                              )}

                              {exercise.sets && exercise.sets.length > 0 ? (
                                <View style={styles.setsContainer}>
                                  <View
                                    style={[
                                      styles.setsHeader,
                                      { backgroundColor: colors.card },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.setsHeaderText,
                                        {
                                          flex: 1,
                                          color: colors.secondary,
                                        },
                                      ]}
                                    >
                                      {t("training.set") || "Série"}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.setsHeaderText,
                                        {
                                          flex: 1,
                                          textAlign: "center",
                                          color: colors.secondary,
                                        },
                                      ]}
                                    >
                                      {t("training.weight") || "Peso"}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.setsHeaderText,
                                        {
                                          flex: 1,
                                          textAlign: "center",
                                          color: colors.secondary,
                                        },
                                      ]}
                                    >
                                      {t("training.reps") || "Reps"}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.setsHeaderText,
                                        {
                                          flex: 1,
                                          textAlign: "right",
                                          color: colors.secondary,
                                        },
                                      ]}
                                    >
                                      {t("training.volume") || "Volume"}
                                    </Text>
                                  </View>

                                  {exercise.sets.map((set, setIndex) => (
                                    <View
                                      key={`set-${setIndex}`}
                                      style={[
                                        styles.setRow,
                                        {
                                          backgroundColor:
                                            setIndex % 2 === 0
                                              ? colors.background
                                              : colors.card + "50",
                                          borderBottomColor:
                                            colors.border + "10",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.setCell,
                                          { flex: 1, color: colors.text },
                                        ]}
                                      >
                                        {setIndex + 1}
                                      </Text>
                                      <Text
                                        style={[
                                          styles.setCell,
                                          {
                                            flex: 1,
                                            textAlign: "center",
                                            color: colors.text,
                                            fontWeight: "600",
                                          },
                                        ]}
                                      >
                                        {set.weight}{" "}
                                        {t("training.units.kg") || "kg"}
                                      </Text>
                                      <Text
                                        style={[
                                          styles.setCell,
                                          {
                                            flex: 1,
                                            textAlign: "center",
                                            color: colors.text,
                                          },
                                        ]}
                                      >
                                        {set.reps}
                                      </Text>
                                      <Text
                                        style={[
                                          styles.setCell,
                                          {
                                            flex: 1,
                                            textAlign: "right",
                                            color: colors.primary,
                                            fontWeight: "500",
                                          },
                                        ]}
                                      >
                                        {set.weight * set.reps}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <View
                                  style={[
                                    styles.emptySetsContainer,
                                    { backgroundColor: colors.background },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.emptySetsText,
                                      { color: colors.secondary },
                                    ]}
                                  >
                                    {t("training.export.noSets") ||
                                      "Nenhuma série registrada"}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Conteúdo de exportação da semana */}
            {exportPeriod === "week" && (
              <View style={styles.weekContentContainer}>
                {!weekWorkoutData.some((day) => day.workouts.length > 0) ? (
                  <View
                    style={[
                      styles.emptyStateContainer,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={24}
                      color={colors.secondary}
                      style={{ marginBottom: 8 }}
                    />
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("training.export.noWorkoutsWeek") ||
                        "Não há treinos registrados para esta semana"}
                    </Text>
                  </View>
                ) : (
                  weekWorkoutData.map((day, dayIndex) => {
                    // Pular dias sem treinos
                    if (day.workouts.length === 0) return null;

                    return (
                      <View key={`day-${dayIndex}`} style={styles.dayCard}>
                        <View
                          style={[
                            styles.dayHeader,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Text
                            style={[styles.dayTitle, { color: colors.text }]}
                          >
                            {day.formattedDate}
                          </Text>
                        </View>

                        {day.workouts.map((workout, workoutIndex) => {
                          if (!workout) return null;

                          return (
                            <View
                              key={`week-workout-${workoutIndex}`}
                              style={[
                                styles.weekWorkoutCard,
                                {
                                  backgroundColor: colors.background,
                                  borderColor: colors.border + "30",
                                },
                              ]}
                            >
                              <View style={styles.weekWorkoutHeader}>
                                <View style={styles.weekWorkoutTitleContainer}>
                                  <View
                                    style={[
                                      styles.weekWorkoutIconContainer,
                                      { backgroundColor: workout.type.color },
                                    ]}
                                  >
                                    <Ionicons
                                      name="barbell-outline"
                                      size={16}
                                      color="#fff"
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      styles.weekWorkoutTitle,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {workout.type.name}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={[
                                  styles.weekStatsContainer,
                                  { backgroundColor: colors.card },
                                ]}
                              >
                                <View style={styles.weekStatItem}>
                                  <Text
                                    style={[
                                      styles.weekStatValue,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {workout.totals.totalExercises}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.weekStatLabel,
                                      { color: colors.secondary },
                                    ]}
                                  >
                                    {t("training.stats.exercises") ||
                                      "Exercícios"}
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    styles.weekStatDivider,
                                    { backgroundColor: colors.border + "30" },
                                  ]}
                                />

                                <View style={styles.weekStatItem}>
                                  <Text
                                    style={[
                                      styles.weekStatValue,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {workout.totals.totalSets}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.weekStatLabel,
                                      { color: colors.secondary },
                                    ]}
                                  >
                                    {t("training.stats.sets") || "Séries"}
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    styles.weekStatDivider,
                                    { backgroundColor: colors.border + "30" },
                                  ]}
                                />

                                <View style={styles.weekStatItem}>
                                  <Text
                                    style={[
                                      styles.weekStatValue,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {formatNumber(workout.totals.totalVolume)}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.weekStatLabel,
                                      { color: colors.secondary },
                                    ]}
                                  >
                                    {t("training.stats.volume") || "Volume"}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.weekExercisesListContainer}>
                                <Text
                                  style={[
                                    styles.weekExercisesListTitle,
                                    { color: colors.secondary },
                                  ]}
                                >
                                  {t("training.exercisesList") ||
                                    "Lista de Exercícios"}
                                  :
                                </Text>

                                {workout.exercises.map(
                                  (exercise, exerciseIndex) => (
                                    <View
                                      key={`week-exercise-${exerciseIndex}`}
                                      style={[
                                        styles.weekExerciseItem,
                                        {
                                          backgroundColor: colors.background,
                                          borderColor: colors.border + "10",
                                        },
                                      ]}
                                    >
                                      <View style={styles.weekExerciseItemLeft}>
                                        <View
                                          style={[
                                            styles.weekExerciseIconContainer,
                                            {
                                              backgroundColor:
                                                workout.type.color + "20",
                                            },
                                          ]}
                                        >
                                          <MaterialCommunityIcons
                                            name="arm-flex"
                                            size={12}
                                            color={workout.type.color}
                                          />
                                        </View>
                                        <Text
                                          style={[
                                            styles.weekExerciseName,
                                            { color: colors.text },
                                          ]}
                                        >
                                          {exercise.name}
                                        </Text>
                                      </View>
                                      <Text
                                        style={[
                                          styles.weekExerciseSets,
                                          { color: workout.type.color },
                                        ]}
                                      >
                                        {exercise.sets
                                          ? exercise.sets.length
                                          : 0}{" "}
                                        {t("training.shortSets") || "séries"}
                                      </Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            <LinearGradient
              colors={[colors.card, colors.primary + "20"]}
              style={styles.exportFooter}
            >
              <View style={styles.footerContent}>
                <View
                  style={[
                    styles.footerDivider,
                    { backgroundColor: "rgba(0,0,0,0.1)" },
                  ]}
                />
                <View style={styles.footerBranding}>
                  <Text
                    style={[styles.exportFooterText, { color: colors.text }]}
                  >
                    {t("training.export.createdWith") || "Criado com"}
                  </Text>
                  <Text
                    style={[styles.exportFooterApp, { color: colors.primary }]}
                  >
                    FitFolio
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  successMessageText: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 220,
    paddingTop: 12,
    flexGrow: 1,
  },
  exportContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  exportHeader: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 32,
  },
  appBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: "800",
  },
  exportTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  dateIcon: {
    marginRight: 6,
  },
  exportDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  contentTitleContainer: {
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 12,
    alignItems: "center",
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  dayContentContainer: {
    paddingHorizontal: 12,
  },
  weekContentContainer: {
    paddingHorizontal: 12,
  },
  emptyStateContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  workoutCard: {
    marginBottom: 24,
  },
  workoutHeader: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  workoutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  exercisesContainer: {
    marginBottom: 8,
  },
  exerciseCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  exerciseTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  exerciseStatsContainer: {
    alignItems: "center",
  },
  exerciseSets: {
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseSetsLabel: {
    fontSize: 10,
  },
  exerciseNotes: {
    padding: 10,
    margin: 12,
    borderRadius: 8,
  },
  exerciseNotesLabel: {
    fontWeight: "600",
    marginBottom: 2,
    fontSize: 13,
  },
  exerciseNotesText: {
    fontSize: 13,
  },
  setsContainer: {
    borderRadius: 8,
    overflow: "hidden",
    margin: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  setsHeader: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  setsHeaderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  setRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
  },
  setCell: {
    fontSize: 13,
  },
  emptySetsContainer: {
    padding: 16,
    alignItems: "center",
    margin: 12,
    borderRadius: 8,
  },
  emptySetsText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  dayCard: {
    marginBottom: 20,
  },
  dayHeader: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  weekWorkoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  weekWorkoutHeader: {
    padding: 12,
  },
  weekWorkoutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  weekWorkoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  weekWorkoutTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  weekStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  weekStatItem: {
    alignItems: "center",
  },
  weekStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  weekStatLabel: {
    fontSize: 11,
  },
  weekStatDivider: {
    width: 1,
    height: 30,
  },
  weekExercisesListContainer: {
    padding: 12,
  },
  weekExercisesListTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  weekExerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  weekExerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  weekExerciseIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  weekExerciseName: {
    fontSize: 14,
  },
  weekExerciseSets: {
    fontSize: 14,
    fontWeight: "600",
  },
  exportFooter: {
    padding: 24,
  },
  footerContent: {
    alignItems: "center",
  },
  footerDivider: {
    height: 1,
    width: 60,
    marginBottom: 16,
  },
  footerBranding: {
    alignItems: "center",
  },
  exportFooterText: {
    fontSize: 12,
  },
  exportFooterApp: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
});
