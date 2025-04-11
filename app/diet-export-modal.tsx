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
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { useMeals } from "../context/MealContext";
import { useNutrition } from "../context/NutritionContext";
import { useAuth } from "../context/AuthContext";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "../hooks/useDateLocale";
import { getLocalDate } from "../utils/dateUtils";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";

export default function DietExportModal() {
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
  // Para controlar se o compartilhamento foi cancelado pelo usuário
  const isSharingCanceledRef = useRef(false);

  // Nome do usuário usando o mesmo formato do HomeHeader
  const userName = useMemo(() => {
    return user?.displayName?.split(" ")[0] || t("common.user");
  }, [user?.displayName, t]);

  const {
    meals,
    selectedDate,
    mealTypes,
    getFoodsForMeal,
    getMealTotals,
    getDayTotals,
  } = useMeals();

  const { nutritionInfo } = useNutrition();

  // Formatar a data para exibição
  const formattedDate = formatDateWithWeekday(getLocalDate(selectedDate));
  // Formatar apenas o mês
  const formattedMonth = format(getLocalDate(selectedDate), "MMMM yyyy");

  // Obter as refeições configuradas com alimentos
  const configuredMeals = mealTypes.map((mealType) => {
    const foods = getFoodsForMeal(mealType.id);
    const mealTotals = getMealTotals(mealType.id);

    return {
      ...mealType,
      foods,
      totals: mealTotals,
    };
  });

  // Obter os totais do dia
  const dayTotals = getDayTotals();

  // Função para calcular a porcentagem de cada macronutriente
  const calculateMacroPercentage = (macro: number, totalCalories: number) => {
    if (totalCalories === 0) return 0;
    return Math.round((macro / totalCalories) * 100);
  };

  // Função para formatar números com no máximo 1 casa decimal
  const formatNumber = (value: number): string => {
    return value.toFixed(1).replace(/\.0$/, "");
  };

  // Obter as porcentagens dos macronutrientes
  const proteinPercentage = calculateMacroPercentage(
    dayTotals.protein * 4,
    dayTotals.calories
  );
  const carbsPercentage = calculateMacroPercentage(
    dayTotals.carbs * 4,
    dayTotals.calories
  );
  const fatPercentage = calculateMacroPercentage(
    dayTotals.fat * 9,
    dayTotals.calories
  );

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
      return info.exists;
    } catch (error: any) {
      console.error(`Erro ao verificar arquivo ${path}:`, error.message);
      return false;
    }
  };

  // Função para mostrar o modal de opções de exportação
  const showExportOptions = () => {
    console.log("Abrindo modal de opções de exportação");
    Alert.alert(
      t("nutrition.export.chooseFormat") || "Escolher formato",
      t("nutrition.export.formatDescription") ||
        "Escolha o formato para exportar seu plano alimentar.",
      [
        {
          text: t("nutrition.export.imageFormat") || "Imagem (PNG)",
          onPress: () => {
            setExportOption("image");
            console.log("Selecionou opção: Imagem/PNG");
            handleShare();
          },
        },
        {
          text: t("nutrition.export.pdfFormat") || "Documento (PDF)",
          onPress: () => {
            setExportOption("pdf");
            console.log("Selecionou opção: PDF");
            handleShare();
          },
        },
        {
          text: t("common.cancel") || "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  // Função para compartilhar a captura de tela
  const handleShare = async () => {
    try {
      console.log("Iniciando processo de compartilhamento...");
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      console.log(`Compartilhamento disponível: ${isAvailable}`);

      if (!isAvailable) {
        Alert.alert(
          t("common.error"),
          t("nutrition.export.sharingNotAvailable")
        );
        setIsSharing(false);
        return;
      }

      // Verificar permissão de escrita no sistema de arquivos (diagnóstico)
      try {
        const documentDir = FileSystem.documentDirectory;
        console.log(`Diretório de documentos: ${documentDir}`);
        if (documentDir) {
          await checkFilePermissions(documentDir);
        }
      } catch (error) {
        console.warn("Erro ao verificar permissões de diretório:", error);
        // Continuamos mesmo com erro na verificação
      }

      // Gerar HTML que representa o plano alimentar visualmente
      console.log("Gerando conteúdo HTML...");
      const htmlContent = generateHtmlContent();
      console.log(`HTML gerado com ${htmlContent.length} caracteres`);

      try {
        // Gerar PDF independentemente do tipo de exportação
        console.log("Iniciando geração de PDF...");

        // Se a opção for PDF, usar configurações avançadas
        if (exportOption === "pdf") {
          // As opções avançadas não são suportadas, usando as básicas
          console.log(
            "Usando configurações PDF padrão para melhor compatibilidade"
          );
        }

        const pdfUri = await Print.printToFileAsync({
          html: htmlContent,
          width: 612,
          height: 792,
        });
        console.log(`PDF gerado: ${pdfUri.uri}`);

        // Verificando se o arquivo foi gerado corretamente
        const fileInfo = await FileSystem.getInfoAsync(pdfUri.uri);
        if (!fileInfo.exists || fileInfo.size === 0) {
          console.error("Arquivo PDF não existe ou está vazio");
          throw new Error("Arquivo PDF não foi gerado corretamente");
        }

        console.log(`Arquivo gerado: ${pdfUri.uri} (${fileInfo.size} bytes)`);

        // Definir o tipo MIME e UTI corretos baseados na opção selecionada
        let mimeType = "application/pdf";
        let uti = "com.adobe.pdf";
        let fileUri = pdfUri.uri;

        // Se a opção for imagem, tentamos capturar como PNG
        if (exportOption === "image") {
          try {
            console.log("Tentando capturar como imagem PNG...");
            console.log(`Plataforma: ${Platform.OS}`);

            // Tentar capturar como imagem usando o ViewShot
            if (
              viewShotRef.current &&
              typeof viewShotRef.current.capture === "function"
            ) {
              console.log("ViewShot está disponível, tentando capturar...");

              // Configurações específicas para determinadas plataformas
              let captureOptions = {};

              // Em iOS a captura direta como arquivo funciona melhor
              if (Platform.OS === "ios") {
                captureOptions = {
                  format: "png",
                  quality: 0.9,
                  result: "tmpfile", // Salva em arquivo temporário no iOS
                };
              } else {
                // Em Android, o data-uri geralmente é mais confiável
                captureOptions = {
                  format: "png",
                  quality: 0.9,
                  result: "data-uri", // Usa data-uri no Android
                };
              }

              console.log(
                `Usando opções de captura: ${JSON.stringify(captureOptions)}`
              );
              const imageUri = await viewShotRef.current.capture(
                captureOptions
              );

              if (imageUri) {
                console.log(
                  `Imagem capturada com sucesso: ${imageUri.substring(
                    0,
                    30
                  )}...`
                );

                // Atualizar o tipo MIME e UTI para PNG
                mimeType = "image/png";
                uti = "public.png";
                fileUri = imageUri;
                console.log(
                  `Configurado para compartilhar como PNG: ${fileUri.substring(
                    0,
                    30
                  )}...`
                );
              } else {
                console.log("Captura de imagem falhou: imageUri está vazio");
              }
            } else {
              console.log(
                "ViewShot não está disponível ou não tem método capture"
              );
            }

            if (mimeType === "application/pdf") {
              // Se chegou aqui com mimeType ainda PDF, a captura de imagem falhou
              console.log(
                "Não foi possível capturar como imagem, usando PDF como fallback"
              );
            }
          } catch (error) {
            console.warn("Erro ao capturar imagem:", error);
            console.log(
              "Usando PDF como fallback devido a erro na captura de imagem"
            );
          }
        } else {
          console.log(
            "Opção PDF selecionada, gerando documento PDF de alta qualidade..."
          );
        }

        // Compartilhar o arquivo (seja PDF ou PNG)
        console.log(`Compartilhando arquivo: ${fileUri}`);
        console.log(`MIME: ${mimeType}, UTI: ${uti}`);

        // Usar Promise.race para adicionar um timeout ao compartilhamento
        // para evitar que fique travado no Expo Go
        try {
          // Definir um tempo maior para permitir ao usuário selecionar opções
          // Um minuto deve ser suficiente para escolher entre as opções
          const timeoutDuration = 60000; // 60 segundos

          const sharePromise = Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            UTI: uti,
            dialogTitle: t("nutrition.export.shareTitle"),
          });

          // Timeout mais longo
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              // Verificar se o usuário cancelou intencionalmente antes de mostrar erro
              if (!isSharingCanceledRef.current) {
                reject(
                  new Error(
                    "O compartilhamento demorou muito tempo. Tente usar a opção 'Visualizar' se o compartilhamento não funcionar."
                  )
                );
              } else {
                // Se foi cancelado, não queremos mostrar erro
                reject(new Error("user_cancelled"));
              }
            }, timeoutDuration);
          });

          // Adicionar um listener para detectar quando o usuário sai da interface de compartilhamento
          const appStateListener = AppState.addEventListener(
            "change",
            (nextAppState) => {
              if (nextAppState === "active") {
                // Se o aplicativo voltou a ficar ativo (o que acontece ao fechar o compartilhamento),
                // consideramos que o usuário cancelou ou completou a operação
                console.log(
                  "App voltou a ficar ativo, provável que o compartilhamento foi cancelado ou concluído"
                );
                isSharingCanceledRef.current = true;
              }
            }
          );

          try {
            await Promise.race([sharePromise, timeoutPromise]);
            console.log("Arquivo compartilhado com sucesso!");

            // Se chegou até aqui, foi compartilhado com sucesso
            setSharedMessage(t("nutrition.export.shareSuccess"));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (innerError: any) {
            console.log("Resultado do compartilhamento:", innerError?.message);

            // Não mostrar erro se foi um cancelamento do usuário
            if (
              innerError?.message !== "user_cancelled" &&
              !isSharingCanceledRef.current &&
              !innerError?.message?.toLowerCase().includes("cancel")
            ) {
              // Se não foi cancelado pelo usuário, mostramos o erro
              console.error("Erro no compartilhamento:", innerError);
              Alert.alert(
                t("common.error"),
                "Problema ao compartilhar o arquivo. Tente usar o botão de visualização direta."
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
              console.log(
                "Compartilhamento cancelado pelo usuário, não mostrando erro"
              );
            }
          } finally {
            // Remover o listener
            appStateListener.remove();
            // Resetar o flag
            isSharingCanceledRef.current = false;
          }

          // Limpar a mensagem após 3 segundos se houver alguma
          if (sharedMessage) {
            setTimeout(() => {
              setSharedMessage("");
            }, 3000);
          }
        } catch (error: any) {
          console.error("Erro ao compartilhar:", error);
          Alert.alert(
            t("common.error"),
            `${t("nutrition.export.shareError")}: ${error.message || ""}`
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (captureError: any) {
        console.error("Erro na exportação:", captureError);
        Alert.alert(
          t("common.error"),
          `Erro ao gerar o documento: ${
            captureError.message || "Erro desconhecido"
          }`
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error("Erro geral ao compartilhar:", error);
      Alert.alert(
        t("common.error"),
        `${t("nutrition.export.shareError")}: ${error.message || ""}`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      console.log("Finalizando processo de compartilhamento");
      setIsSharing(false);
    }
  };

  // Função para gerar HTML do plano alimentar
  const generateHtmlContent = () => {
    // Cores e estilos baseados no tema atual
    const primaryColor = colors.primary;
    const textColor = colors.text;
    const backgroundColor = colors.light;
    const cardColor = colors.card;
    const borderColor = colors.border;
    const secondaryTextColor = colors.secondary;

    // Estilos de proteína, carboidratos e gordura
    const proteinColor = theme === "dark" ? "#FF8A8A" : "#FF6B6B";
    const carbsColor = theme === "dark" ? "#6FEEE5" : "#4ECDC4";
    const fatColor = theme === "dark" ? "#FFE78A" : "#FFD166";

    // Gerar HTML para refeições
    const mealsHtml = configuredMeals
      .map((meal) => {
        // Lista de alimentos
        const foodsHtml = meal.foods.length
          ? meal.foods
              .map(
                (food, foodIndex) => `
                <div style="display: flex; justify-content: space-between; padding: 12px; ${
                  foodIndex < meal.foods.length - 1
                    ? `border-bottom: 1px solid ${borderColor}30;`
                    : ""
                } background-color: ${cardColor}50;">
                  <div style="flex: 1; margin-right: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: ${textColor}; margin-bottom: 6px;">${
                  food.name
                }</div>
                    <div style="display: flex; align-items: center;">
                      <div style="padding: 2px 8px; border-radius: 10px; background-color: ${
                        theme === "dark"
                          ? primaryColor + "20"
                          : "rgba(0,0,0,0.05)"
                      }; margin-right: 8px; border: 1px solid rgba(0,0,0,0.03);">
                        <span style="font-size: 10px; font-weight: 500; color: ${
                          theme === "dark" ? primaryColor : secondaryTextColor
                        };">
                          ${
                            food.portionDescription ||
                            `${formatNumber(food.portion)}${t(
                              "nutrition.units.gram"
                            )}`
                          }
                        </span>
                      </div>
                      <div style="font-size: 11px; color: ${secondaryTextColor};">
                        <span style="color: ${proteinColor}; font-weight: 600;">${formatNumber(
                  food.protein
                )}p</span> •
                        <span style="color: ${carbsColor}; font-weight: 600;"> ${formatNumber(
                  food.carbs
                )}c</span> •
                        <span style="color: ${fatColor}; font-weight: 600;"> ${formatNumber(
                  food.fat
                )}g</span>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center;">
                    <div style="padding: 6px 10px; border-radius: 10px; background-color: ${
                      meal.color + "20"
                    }; border: 1px solid ${
                  meal.color + "40"
                }; text-align: center;">
                      <div style="font-size: 14px; font-weight: 700; color: ${
                        meal.color
                      };">${formatNumber(food.calories)}</div>
                      <div style="font-size: 9px; color: ${
                        meal.color
                      }; font-weight: 500;">${t("nutrition.units.kcal")}</div>
                    </div>
                  </div>
                </div>
              `
              )
              .join("")
          : `
            <div style="padding: 20px; text-align: center; border-radius: 12px; border: 1px solid rgba(0,0,0,0.03); background-color: ${cardColor}50;">
              <div style="margin-bottom: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${
                  secondaryTextColor + "80"
                }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 10h10M14 14h3M7 14h3m4 4h6M7 18h3"/>
                </svg>
              </div>
              <div style="font-size: 12px; font-style: italic; color: ${secondaryTextColor};">${t(
              "nutrition.export.noFoods"
            )}</div>
            </div>
          `;

        // HTML para cada refeição
        return `
          <div style="margin: 12px; margin-top: 0; border-radius: 16px; padding: 16px; overflow: hidden; 
          background-color: ${backgroundColor}; border: 1px solid ${borderColor}30;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="display: flex; align-items: center;">
                <div style="width: 36px; height: 36px; border-radius: 18px; display: flex; justify-content: center; 
                align-items: center; background-color: ${
                  meal.color
                }20; margin-right: 12px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                  stroke="${
                    meal.color
                  }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 10h10M14 14h3M7 14h3m4 4h6M7 18h3"/>
                  </svg>
                </div>
                <div style="font-size: 16px; font-weight: 700; color: ${textColor};">
                  ${t(`nutrition.mealTypes.${meal.id}`, {
                    defaultValue: meal.name,
                  })}
                </div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 16px; font-weight: 700; color: ${
                  meal.color
                };">
                  ${formatNumber(meal.totals.calories)}
                </div>
                <div style="font-size: 10px; font-weight: 500; color: ${secondaryTextColor};">
                  ${t("nutrition.units.kcal")}
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-radius: 12px; 
            padding: 12px; background-color: ${cardColor}; border: 1px solid ${borderColor}20;">
              <div style="flex: 1; text-align: center;">
                <div style="font-size: 15px; font-weight: 700; color: ${proteinColor};">
                  ${formatNumber(meal.totals.protein)}g
                </div>
                <div style="font-size: 11px; margin-top: 2px; color: ${secondaryTextColor};">
                  ${t("nutrition.macros.protein_short")}
                </div>
              </div>
              <div style="width: 1px; height: 24px; background-color: ${borderColor}30; margin: 0 4px;"></div>
              <div style="flex: 1; text-align: center;">
                <div style="font-size: 15px; font-weight: 700; color: ${carbsColor};">
                  ${formatNumber(meal.totals.carbs)}g
                </div>
                <div style="font-size: 11px; margin-top: 2px; color: ${secondaryTextColor};">
                  ${t("nutrition.macros.carbs_short")}
                </div>
              </div>
              <div style="width: 1px; height: 24px; background-color: ${borderColor}30; margin: 0 4px;"></div>
              <div style="flex: 1; text-align: center;">
                <div style="font-size: 15px; font-weight: 700; color: ${fatColor};">
                  ${formatNumber(meal.totals.fat)}g
                </div>
                <div style="font-size: 11px; margin-top: 2px; color: ${secondaryTextColor};">
                  ${t("nutrition.macros.fat_short")}
                </div>
              </div>
            </div>

            <div style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.03);">
              ${foodsHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // HTML completo para o documento
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
          <title>FitFolio - Plano Alimentar</title>
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
                    ${formattedMonth}
                  </div>
                </div>
              </div>
            </div>

            <div style="margin: 12px; border-radius: 16px; padding: 16px; background-color: ${backgroundColor}; 
            border: 1px solid ${borderColor}30; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 20px; color: ${textColor};">
                ${t("nutrition.export.dailySummary")}
              </div>

              <div style="display: flex; align-items: center;">
                <div style="width: 100px; text-align: center; padding: 12px 0;">
                  <div style="width: 36px; height: 36px; border-radius: 18px; background-color: ${primaryColor}15; 
                  display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                    stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L4.5 20.5H19.5L12 2Z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div style="font-size: 26px; font-weight: 800; color: ${primaryColor};">
                    ${formatNumber(dayTotals.calories)}
                  </div>
                  <div style="font-size: 12px; font-weight: 500; margin-top: 4px; color: ${secondaryTextColor};">
                    ${t("nutrition.units.kcal")}
                  </div>
                </div>

                <div style="width: 1px; height: 70px; margin: 0 12px; background-color: ${borderColor}30;"></div>

                <div style="flex: 1; padding-left: 8px;">
                  <!-- Proteína -->
                  <div style="display: flex; justify-content: space-between; align-items: center; 
                  padding: 8px 12px; border-radius: 12px; margin-bottom: 8px; background-color: ${
                    theme === "dark" ? "#FF6B6B15" : "#FF6B6B10"
                  }; 
                  border: 1px solid ${
                    theme === "dark" ? "#FF8A8A30" : "#FF6B6B30"
                  };">
                    <div style="display: flex; align-items: center;">
                      <div style="width: 24px; height: 24px; border-radius: 12px; background-color: ${proteinColor}; 
                      display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" 
                        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 13v4M6 21v-1M18 15v2M18 21v-1M6 8V7m0-6h12v7M6 8h12M4 8h2m14 0h2M2 8v10a2 2 0 0 0 2 2h8M22 8v10a2 2 0 0 1-2 2h-7"/>
                        </svg>
                      </div>
                      <div>
                        <div style="font-size: 14px; font-weight: 700; color: ${proteinColor};">
                          ${formatNumber(dayTotals.protein)}g
                        </div>
                        <div style="font-size: 10px; font-weight: 500; color: ${textColor};">
                          ${t("common.nutrition.protein")}
                        </div>
                      </div>
                    </div>
                    <div style="width: 34px; height: 20px; border-radius: 10px; background-color: ${proteinColor}; 
                    display: flex; align-items: center; justify-content: center;">
                      <div style="color: #fff; font-size: 10px; font-weight: 600;">
                        ${proteinPercentage}%
                      </div>
                    </div>
                  </div>

                  <!-- Carboidratos -->
                  <div style="display: flex; justify-content: space-between; align-items: center; 
                  padding: 8px 12px; border-radius: 12px; margin-bottom: 8px; background-color: ${
                    theme === "dark" ? "#4ECDC415" : "#4ECDC410"
                  }; 
                  border: 1px solid ${
                    theme === "dark" ? "#6FEEE530" : "#4ECDC430"
                  };">
                    <div style="display: flex; align-items: center;">
                      <div style="width: 24px; height: 24px; border-radius: 12px; background-color: ${carbsColor}; 
                      display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" 
                        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 5h3v3h-3z"/><path d="M10 5h3v3h-3z"/><path d="M3 5h3v3H3z"/><path d="M17 12h3v3h-3z"/>
                          <path d="M10 12h3v3h-3z"/><path d="M3 12h3v3H3z"/><path d="M17 19h3v3h-3z"/><path d="M10 19h3v3h-3z"/>
                          <path d="M3 19h3v3H3z"/>
                        </svg>
                      </div>
                      <div>
                        <div style="font-size: 14px; font-weight: 700; color: ${carbsColor};">
                          ${formatNumber(dayTotals.carbs)}g
                        </div>
                        <div style="font-size: 10px; font-weight: 500; color: ${textColor};">
                          ${t("common.nutrition.carbs")}
                        </div>
                      </div>
                    </div>
                    <div style="width: 34px; height: 20px; border-radius: 10px; background-color: ${carbsColor}; 
                    display: flex; align-items: center; justify-content: center;">
                      <div style="color: #fff; font-size: 10px; font-weight: 600;">
                        ${carbsPercentage}%
                      </div>
                    </div>
                  </div>

                  <!-- Gordura -->
                  <div style="display: flex; justify-content: space-between; align-items: center; 
                  padding: 8px 12px; border-radius: 12px; background-color: ${
                    theme === "dark" ? "#FFD16615" : "#FFD16610"
                  }; 
                  border: 1px solid ${
                    theme === "dark" ? "#FFE78A30" : "#FFD16630"
                  };">
                    <div style="display: flex; align-items: center;">
                      <div style="width: 24px; height: 24px; border-radius: 12px; background-color: ${fatColor}; 
                      display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" 
                        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                        </svg>
                      </div>
                      <div>
                        <div style="font-size: 14px; font-weight: 700; color: ${fatColor};">
                          ${formatNumber(dayTotals.fat)}g
                        </div>
                        <div style="font-size: 10px; font-weight: 500; color: ${textColor};">
                          ${t("common.nutrition.fat")}
                        </div>
                      </div>
                    </div>
                    <div style="width: 34px; height: 20px; border-radius: 10px; background-color: ${fatColor}; 
                    display: flex; align-items: center; justify-content: center;">
                      <div style="color: #fff; font-size: 10px; font-weight: 600;">
                        ${fatPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            ${mealsHtml}

            <div style="padding: 24px; background: linear-gradient(${cardColor}, ${primaryColor}20);">
              <div style="text-align: center;">
                <div style="height: 1px; width: 60px; background-color: rgba(0,0,0,0.1); margin: 0 auto 16px;"></div>
                <div style="font-size: 12px; color: ${textColor};">
                  ${t("nutrition.export.createdWith")}
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
            {t("nutrition.export.title")}
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
                        t("nutrition.export.viewSuccess") ||
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
                  {formattedMonth}
                </Text>
              </View>
            </LinearGradient>

            {/* Resumo de macronutrientes */}
            <View
              style={[
                styles.macroSummaryCard,
                {
                  backgroundColor: colors.light,
                  borderColor: colors.border + "30",
                },
              ]}
            >
              <Text style={[styles.macroSummaryTitle, { color: colors.text }]}>
                {t("nutrition.export.dailySummary")}
              </Text>

              {/* Calorias e gráfico de macros */}
              <View style={styles.summaryMainContent}>
                {/* Calorias */}
                <View style={styles.caloriesContainer}>
                  <View
                    style={[
                      styles.caloriesIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="flame-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={[styles.calorieValue, { color: colors.primary }]}
                  >
                    {formatNumber(dayTotals.calories)}
                  </Text>
                  <Text
                    style={[styles.calorieLabel, { color: colors.secondary }]}
                  >
                    {t("nutrition.units.kcal")}
                  </Text>
                </View>

                {/* Separador vertical */}
                <View
                  style={[
                    styles.verticalDivider,
                    { backgroundColor: colors.border + "30" },
                  ]}
                />

                {/* Macros em cards */}
                <View style={styles.macrosCardsContainer}>
                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor:
                          theme === "dark" ? "#FF6B6B15" : "#FF6B6B10",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark" ? "#FF8A8A30" : "#FF6B6B30",
                      },
                    ]}
                  >
                    <View style={styles.macroCardContent}>
                      <View
                        style={[
                          styles.macroCardIconContainer,
                          {
                            backgroundColor:
                              theme === "dark" ? "#FF8A8A" : "#FF6B6B",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="food-steak"
                          size={15}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.macroCardTextContainer}>
                        <Text
                          style={[
                            styles.macroCardValue,
                            { color: theme === "dark" ? "#FF8A8A" : "#FF6B6B" },
                          ]}
                        >
                          {formatNumber(dayTotals.protein)}g
                        </Text>
                        <Text
                          style={[
                            styles.macroCardLabel,
                            { color: colors.text },
                          ]}
                        >
                          {t("common.nutrition.protein")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.macroPercentageBadge,
                        {
                          backgroundColor:
                            theme === "dark" ? "#FF8A8A" : "#FF6B6B",
                        },
                      ]}
                    >
                      <Text style={styles.macroPercentageValue}>
                        {proteinPercentage}%
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor:
                          theme === "dark" ? "#4ECDC415" : "#4ECDC410",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark" ? "#6FEEE530" : "#4ECDC430",
                      },
                    ]}
                  >
                    <View style={styles.macroCardContent}>
                      <View
                        style={[
                          styles.macroCardIconContainer,
                          {
                            backgroundColor:
                              theme === "dark" ? "#6FEEE5" : "#4ECDC4",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="bread-slice"
                          size={15}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.macroCardTextContainer}>
                        <Text
                          style={[
                            styles.macroCardValue,
                            { color: theme === "dark" ? "#6FEEE5" : "#4ECDC4" },
                          ]}
                        >
                          {formatNumber(dayTotals.carbs)}g
                        </Text>
                        <Text
                          style={[
                            styles.macroCardLabel,
                            { color: colors.text },
                          ]}
                        >
                          {t("common.nutrition.carbs")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.macroPercentageBadge,
                        {
                          backgroundColor:
                            theme === "dark" ? "#6FEEE5" : "#4ECDC4",
                        },
                      ]}
                    >
                      <Text style={styles.macroPercentageValue}>
                        {carbsPercentage}%
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor:
                          theme === "dark" ? "#FFD16615" : "#FFD16610",
                        borderWidth: 1,
                        borderColor:
                          theme === "dark" ? "#FFE78A30" : "#FFD16630",
                      },
                    ]}
                  >
                    <View style={styles.macroCardContent}>
                      <View
                        style={[
                          styles.macroCardIconContainer,
                          {
                            backgroundColor:
                              theme === "dark" ? "#FFE78A" : "#FFD166",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="oil"
                          size={15}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.macroCardTextContainer}>
                        <Text
                          style={[
                            styles.macroCardValue,
                            { color: theme === "dark" ? "#FFE78A" : "#FFD166" },
                          ]}
                        >
                          {formatNumber(dayTotals.fat)}g
                        </Text>
                        <Text
                          style={[
                            styles.macroCardLabel,
                            { color: colors.text },
                          ]}
                        >
                          {t("common.nutrition.fat")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.macroPercentageBadge,
                        {
                          backgroundColor:
                            theme === "dark" ? "#FFE78A" : "#FFD166",
                        },
                      ]}
                    >
                      <Text style={styles.macroPercentageValue}>
                        {fatPercentage}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Lista de refeições */}
            {configuredMeals.map((meal, index) => (
              <View
                key={`meal-${meal.id}`}
                style={[
                  styles.mealCard,
                  {
                    backgroundColor: colors.light,
                    borderWidth: 1,
                    borderColor: colors.border + "30",
                  },
                ]}
              >
                <View style={styles.mealHeader}>
                  <View style={styles.mealHeaderLeft}>
                    <View
                      style={[
                        styles.mealIconContainer,
                        { backgroundColor: meal.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={(meal.icon as any) || "restaurant-outline"}
                        size={16}
                        color={meal.color}
                      />
                    </View>
                    <Text style={[styles.mealName, { color: colors.text }]}>
                      {t(`nutrition.mealTypes.${meal.id}`, {
                        defaultValue: meal.name,
                      })}
                    </Text>
                  </View>
                  <View style={styles.mealCaloriesContainer}>
                    <Text style={[styles.mealCalories, { color: meal.color }]}>
                      {formatNumber(meal.totals.calories)}
                    </Text>
                    <Text
                      style={[
                        styles.mealCaloriesUnit,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("nutrition.units.kcal")}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.mealMacrosRow,
                    {
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border + "20",
                    },
                  ]}
                >
                  <View style={styles.mealMacroItem}>
                    <Text
                      style={[
                        styles.mealMacroValue,
                        { color: theme === "dark" ? "#FF8A8A" : "#FF6B6B" },
                      ]}
                    >
                      {formatNumber(meal.totals.protein)}g
                    </Text>
                    <Text
                      style={[
                        styles.mealMacroLabel,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("nutrition.macros.protein_short")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.macroSeparator,
                      { backgroundColor: colors.border + "30" },
                    ]}
                  />

                  <View style={styles.mealMacroItem}>
                    <Text
                      style={[
                        styles.mealMacroValue,
                        { color: theme === "dark" ? "#6FEEE5" : "#4ECDC4" },
                      ]}
                    >
                      {formatNumber(meal.totals.carbs)}g
                    </Text>
                    <Text
                      style={[
                        styles.mealMacroLabel,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("nutrition.macros.carbs_short")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.macroSeparator,
                      { backgroundColor: colors.border + "30" },
                    ]}
                  />

                  <View style={styles.mealMacroItem}>
                    <Text
                      style={[
                        styles.mealMacroValue,
                        { color: theme === "dark" ? "#FFE78A" : "#FFD166" },
                      ]}
                    >
                      {formatNumber(meal.totals.fat)}g
                    </Text>
                    <Text
                      style={[
                        styles.mealMacroLabel,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("nutrition.macros.fat_short")}
                    </Text>
                  </View>
                </View>

                {meal.foods.length > 0 ? (
                  <View style={styles.foodsList}>
                    {meal.foods.map((food, foodIndex) => (
                      <View
                        key={`food-${food.id}`}
                        style={[
                          styles.foodItem,
                          foodIndex < meal.foods.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border + "30",
                          },
                          { backgroundColor: colors.card + "50" },
                        ]}
                      >
                        <View style={styles.foodItemLeft}>
                          <Text
                            style={[styles.foodName, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {food.name}
                          </Text>
                          <View style={styles.foodInfoRow}>
                            <View
                              style={[
                                styles.portionBadge,
                                {
                                  backgroundColor:
                                    theme === "dark"
                                      ? colors.primary + "20"
                                      : "rgba(0,0,0,0.05)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.foodPortion,
                                  {
                                    color:
                                      theme === "dark"
                                        ? colors.primary
                                        : colors.secondary,
                                  },
                                ]}
                              >
                                {food.portionDescription ||
                                  `${formatNumber(food.portion)}${t(
                                    "nutrition.units.gram"
                                  )}`}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.foodMacros,
                                { color: colors.secondary },
                              ]}
                            >
                              <Text
                                style={{
                                  color:
                                    theme === "dark" ? "#FF8A8A" : "#FF6B6B",
                                  fontWeight: "600",
                                }}
                              >
                                {formatNumber(food.protein)}p
                              </Text>{" "}
                              •
                              <Text
                                style={{
                                  color:
                                    theme === "dark" ? "#6FEEE5" : "#4ECDC4",
                                  fontWeight: "600",
                                }}
                              >
                                {" "}
                                {formatNumber(food.carbs)}c
                              </Text>{" "}
                              •
                              <Text
                                style={{
                                  color:
                                    theme === "dark" ? "#FFE78A" : "#FFD166",
                                  fontWeight: "600",
                                }}
                              >
                                {" "}
                                {formatNumber(food.fat)}g
                              </Text>
                            </Text>
                          </View>
                        </View>
                        <View style={styles.foodItemRight}>
                          <View
                            style={[
                              styles.caloriesBadge,
                              {
                                backgroundColor: meal.color + "20",
                                borderWidth: 1,
                                borderColor: meal.color + "40",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.foodCalories,
                                { color: meal.color },
                              ]}
                            >
                              {formatNumber(food.calories)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 9,
                                color: meal.color,
                                fontWeight: "500",
                              }}
                            >
                              {t("nutrition.units.kcal")}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyMealContainer,
                      { backgroundColor: colors.card + "50" },
                    ]}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={22}
                      color={colors.secondary + "80"}
                      style={{ marginBottom: 8 }}
                    />
                    <Text
                      style={[
                        styles.emptyMealText,
                        { color: colors.secondary },
                      ]}
                    >
                      {t("nutrition.export.noFoods")}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <LinearGradient
              colors={[colors.card, colors.primary + "20"]}
              style={styles.exportFooter}
            >
              <View style={styles.footerContent}>
                <View style={styles.footerDivider} />
                <View style={styles.footerBranding}>
                  <Text
                    style={[styles.exportFooterText, { color: colors.text }]}
                  >
                    {t("nutrition.export.createdWith")}
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
  macroSummaryCard: {
    margin: 12,
    borderRadius: 16,
    padding: 16,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
    borderWidth: 1,
  },
  macroSummaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  summaryMainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  caloriesContainer: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  caloriesIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 26,
    fontWeight: "800",
  },
  calorieLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 70,
    marginHorizontal: 12,
  },
  macrosCardsContainer: {
    flex: 1,
    paddingLeft: 8,
  },
  macroCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  macroCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroCardIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  macroCardTextContainer: {
    flexDirection: "column",
  },
  macroCardValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  macroCardLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  macroPercentageBadge: {
    borderRadius: 10,
    width: 34,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  macroPercentageValue: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  mealCard: {
    margin: 12,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
  },
  mealCaloriesContainer: {
    alignItems: "center",
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "700",
  },
  mealCaloriesUnit: {
    fontSize: 10,
    fontWeight: "500",
  },
  mealMacrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  mealMacroItem: {
    alignItems: "center",
    flex: 1,
  },
  mealMacroValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  mealMacroLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  macroSeparator: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  foodsList: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    paddingVertical: 14,
  },
  foodItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  foodInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  portionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  foodPortion: {
    fontSize: 10,
    fontWeight: "500",
  },
  foodItemRight: {
    justifyContent: "center",
  },
  caloriesBadge: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: "700",
  },
  foodMacros: {
    fontSize: 11,
  },
  emptyMealContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  emptyMealText: {
    fontSize: 12,
    fontStyle: "italic",
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
    backgroundColor: "rgba(0,0,0,0.1)",
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
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
