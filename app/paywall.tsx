import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Asset } from "expo-asset";
import { BlurView } from "expo-blur";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { LinearGradient } from "expo-linear-gradient";
import { OfflineStorage } from "../services/OfflineStorage";

const windowHeight = Dimensions.get("window").height;

// Constantes para animação do vídeo
const VIDEO_ORIGINAL_HEIGHT = windowHeight * 0.6;
const VIDEO_MIN_HEIGHT = windowHeight * 0.3; // Vídeo terá 20% da altura da tela no mínimo
const VIDEO_SHRINK_DURATION_SCROLL = windowHeight * 0.3; // Vídeo encolhe totalmente após 30% da altura da tela de scroll

// Constantes para animação do header restauradas
const HEADER_MAX_HEIGHT = 210; // Valor inicial sugerido, ajuste conforme necessário
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT; // Header encolhe até 0

// Pré-carga do vídeo
const videoSource = require("../assets/videos/Paywall3.mp4");

export default function PaywallScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { setIsSubscribed, user } = useAuth();
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const insets = useSafeAreaInsets(); // Obter insets

  // Pré-carregamento do vídeo
  useEffect(() => {
    // Pré-carrega o vídeo
    const preloadVideo = async () => {
      try {
        const asset = Asset.fromModule(videoSource);
        await asset.downloadAsync();
        console.log("Vídeo pré-carregado com sucesso");
      } catch (error) {
        console.error("Erro ao pré-carregar vídeo:", error);
      }
    };

    preloadVideo();
  }, []);

  // Estados do RevenueCat restaurados
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Bottom Sheet refs and snap points
  // const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // const snapPoints = useMemo(() => ["55%"], []); // Ajuste conforme necessário

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, 0], // Header vai até altura 0
    extrapolate: "clamp",
  });
  const mainHeaderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE * 0.7],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });
  const mainHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });
  const collapsedHeaderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.6, HEADER_SCROLL_DISTANCE * 0.8],
    outputRange: [0, 0, 0], // Conteúdo colapsado nunca aparece
    extrapolate: "clamp",
  });

  // Novas interpolações para o fundo do header com blur
  const solidBackgroundOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE * 0.6, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0], // Fundo sólido desaparece
    extrapolate: "clamp",
  });

  const blurEffectOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE * 0.6, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0], // Blur não aparece mais
    extrapolate: "clamp",
  });

  // Nova interpolação para a altura do vídeo
  const videoAnimatedHeight = scrollY.interpolate({
    inputRange: [0, VIDEO_SHRINK_DURATION_SCROLL],
    outputRange: [VIDEO_ORIGINAL_HEIGHT, VIDEO_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  // Estado para controlar quando o vídeo deve ser renderizado
  const [shouldRenderVideo, setShouldRenderVideo] = useState(true);

  // Estado para controlar o plano selecionado
  const [selectedPlan, setSelectedPlan] = useState<PurchasesPackage | null>(null);

  // Use este efeito para monitorar o scroll e determinar se o vídeo deve ser renderizado
  useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => {
      // Se o usuário rolar além de certo ponto, podemos desmontar o vídeo para economizar recursos
      if (value > windowHeight) {
        setShouldRenderVideo(false);
      } else {
        setShouldRenderVideo(true);
      }
    });

    return () => {
      scrollY.removeListener(scrollListener);
    };
  }, []);

  // Handlers para carregamento de vídeo
  const handleVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setVideoLoaded(true);
    }
  };

  // useEffect para buscar ofertas do RevenueCat
  useEffect(() => {
    const getOfferings = async () => {
      setIsLoading(true);
      try {
        const offeringsResult = await Purchases.getOfferings(); // Chamada original restaurada

        // MOCK DATA - Início
        /*
        const mockAnnualPackage = {
          identifier: "annual_mock_pro",
          packageType: "ANNUAL",
          product: {
            identifier: "com.fitfolio.annual.pro.mock",
            description: "Acesso total por um ano com desconto.",
            title: "Plano Anual",
            price: 119.9,
            priceString: "R$119,90",
            currencyCode: "BRL",
            introPrice: {
              price: 0,
              priceString: "Grátis",
              period: "P7D",
              periodUnit: "DAY",
              periodNumberOfUnits: 7,
              cycles: 1,
            },
            discounts: null,
          },
          offeringIdentifier: "default_offering_mock",
        };

        const mockMonthlyPackage = {
          identifier: "monthly_mock_pro",
          packageType: "MONTHLY",
          product: {
            identifier: "com.fitfolio.monthly.pro.mock",
            description: "Acesso total por um mês.",
            title: "Plano Mensal",
            price: 19.9,
            priceString: "R$19,90",
            currencyCode: "BRL",
            introPrice: {
              price: 0,
              priceString: "Grátis",
              period: "P7D",
              periodUnit: "DAY",
              periodNumberOfUnits: 7,
              cycles: 1,
            },
            discounts: null,
          },
          offeringIdentifier: "default_offering_mock",
        };

        const mockOfferingData = {
          identifier: "default_offering_mock",
          serverDescription: "Oferta padrão com dados mockados",
          availablePackages: [mockMonthlyPackage, mockAnnualPackage],
          lifetime: null,
          annual: mockAnnualPackage,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: mockMonthlyPackage,
        };
        */
        // MOCK DATA - Fim

        // Usar dados reais
        if (
          offeringsResult.current !== null &&
          offeringsResult.current.availablePackages.length !== 0
        ) {
          setOffering(offeringsResult.current);
        } else {
          setOffering(null);
        }
      } catch (e) {
        console.error("Erro ao buscar ofertas (ou ao mockar): ", e);
        setOffering(null); // Garante que offering seja null em caso de erro
      } finally {
        setIsLoading(false);
      }
    };
    getOfferings();
  }, []);

  const handleSelectPlan = async (selectedPackage: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (typeof customerInfo.entitlements.active.PRO !== "undefined") {
        setIsSubscribed(true);

        // Salvar status de assinatura localmente para acesso offline
        if (user && user.uid) {
          await OfflineStorage.saveSubscriptionStatus(user.uid, true);
        }

        // bottomSheetModalRef.current?.dismiss(); // Fechar bottom sheet no sucesso
        router.replace("/(tabs)");
      } else {
        alert(t("paywall.purchaseErrorVerification"));
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Erro ao comprar pacote: " + e.message, e);
        alert(t("paywall.purchaseErrorGeneric", { message: e.message }));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active.PRO !== "undefined") {
        // Use seu Entitlement ID
        setIsSubscribed(true);

        // Salvar status de assinatura restaurada localmente
        if (user && user.uid) {
          await OfflineStorage.saveSubscriptionStatus(user.uid, true);
        }

        alert(t("paywall.restoreSuccess")); // Chave para sucesso
        router.replace("/(tabs)");
      } else {
        alert(t("paywall.restoreNoSubscription")); // Chave para nenhuma assinatura encontrada
      }
    } catch (e: any) {
      console.error("Erro ao restaurar compras: ", e);
      alert(t("paywall.restoreError")); // Chave para erro na restauração
    } finally {
      setIsPurchasing(false);
    }
  };

  // Funções para controlar o BottomSheet
  // const handlePresentModalPress = useCallback(() => { ... }, []);
  // const handleSheetChanges = useCallback((index: number) => { ... }, []);
  // const handlePlanSelectedInModal = (pkg: PurchasesPackage) => { ... };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>
          {t("paywall.loadingPlans")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!offering) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={colors.error}
        />
        <Text
          style={[
            styles.title,
            { color: colors.text, marginTop: 16, fontFamily: "Inter-Bold" },
          ]}
        >
          {t("paywall.loadErrorTitle")}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.accentGray,
              textAlign: "center",
              fontFamily: "Inter-Regular",
            },
          ]}
        >
          {t("paywall.loadErrorMessage")}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: colors.primary, marginTop: 20 },
          ]}
          onPress={() => {
            // Função para tentar novamente
            const getOfferings = async () => {
              setIsLoading(true);
              try {
                const offeringsResult = await Purchases.getOfferings();
                if (
                  offeringsResult.current !== null &&
                  offeringsResult.current.availablePackages.length !== 0
                ) {
                  setOffering(offeringsResult.current);
                } else {
                  setOffering(null);
                }
              } catch (e) {
                console.error("Erro ao buscar ofertas do RevenueCat: ", e);
                setOffering(null);
              } finally {
                setIsLoading(false);
              }
            };
            getOfferings();
          }}
        >
          <Text
            style={[
              styles.restoreButtonText, // Reutilizando estilo
              { color: theme === "dark" ? colors.black : colors.background },
            ]}
          >
            {t("paywall.tryAgain")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["left", "right", "bottom"]} // Remover 'top' daqui, pois será tratado pelo padding do header
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header animado restaurado */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            height: Animated.add(headerHeight, insets.top), // Altura total = altura do conteúdo + inset
            borderColor: colors.border,
          },
        ]}
      >
        {/* Camada de fundo sólido (desaparece no colapso) */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.background,
            opacity: solidBackgroundOpacity,
          }}
        />

        {/* Camada de BlurView (aparece no colapso) */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: blurEffectOpacity,
          }}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 70 : 100} // Ajuste a intensidade conforme necessário
            tint={theme === "dark" ? "dark" : "light"} // Mapeia o tema para o tint do BlurView
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.collapsedHeaderContent,
            {
              opacity: collapsedHeaderOpacity,
              top: insets.top, // ADICIONADO para posicionar abaixo da safe area
            },
          ]}
        >
          <Text style={[styles.collapsedHeaderTitle, { color: colors.text }]}>
            {t("paywall.title")}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.mainHeaderContent,
            {
              opacity: mainHeaderOpacity,
              transform: [{ translateY: mainHeaderTranslateY }],
              paddingTop: insets.top, // ADICIONADO para o conteúdo expandido respeitar a safe area
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={60}
            color={colors.primary}
            style={styles.mainHeaderIcon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {t("paywall.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.accentGray }]}>
            {t("paywall.subtitle")}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: HEADER_MAX_HEIGHT + insets.top, // Ajustar paddingTop para considerar o inset do header
            backgroundColor: `${colors.background}B3`, // Adiciona ~70% de opacidade ao fundo do conteúdo do scroll
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View
          style={[
            styles.videoPlaceholder,
            {
              height: videoAnimatedHeight,
              backgroundColor: colors.background,
            },
          ]}
        >
          {!videoLoaded && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {shouldRenderVideo && (
            <Video
              ref={videoRef}
              source={videoSource}
              style={styles.video}
              isMuted
              shouldPlay
              isLooping
              resizeMode={ResizeMode.COVER}
              onLoad={handleVideoLoad}
              rate={1.0}
              volume={0}
              progressUpdateIntervalMillis={1000}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded && !videoLoaded) {
                  setVideoLoaded(true);
                }
              }}
              onError={(error) => {
                console.error("Erro ao carregar vídeo:", error);
              }}
            />
          )}
        </Animated.View>

        {/* Stepper Component - Versão épica e chamativa */}
        {/* <View style={styles.stepperContainer}> ... </View> */}

        {/* Botão Principal para Abrir BottomSheet dos Planos */}
        {/* <TouchableOpacity ... > ... </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.restoreButton, { borderColor: colors.border }]}
          onPress={handleRestorePurchases}
          disabled={isPurchasing}
        >
          <Text
            style={[styles.restoreButtonText, { color: colors.accentGray }]}
          >
            {t("paywall.restorePurchases.button")}
          </Text>
        </TouchableOpacity>

        {/* NOVO: Exibir cards de planos diretamente na tela */}
        {offering && offering.availablePackages.length > 0 && (
          <View style={[styles.plansContainerBS, { paddingHorizontal: 12 }]}>
            {offering.availablePackages.map((pkg) => {
              const isAnnual =
                pkg.packageType === "ANNUAL" ||
                pkg.identifier === offering.annual?.identifier;
              const isPopular = isAnnual;
              let frequencyText = "";
              if (pkg.packageType === "ANNUAL") {
                frequencyText = t("paywall.annual.frequencyDetails", {
                  pricePerMonth: (pkg.product.price / 12)
                    .toFixed(2)
                    .replace(".", ","),
                });
              } else if (pkg.packageType === "MONTHLY") {
                frequencyText = t("paywall.monthly.frequencyDetails");
              } else {
                frequencyText = pkg.product.description || "";
              }
              const isSelected = selectedPlan?.identifier === pkg.identifier;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.planCardBS,
                    isPopular && styles.planCardAnnualBS,
                    isSelected
                      ? {
                          borderWidth: 2,
                          borderColor: '#fff',
                          backgroundColor: colors.card,
                          transform: [{ scale: 1.06 }],
                          zIndex: 2,
                          shadowColor: '#fff',
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 8,
                        }
                      : {
                          borderWidth: 1,
                          borderColor: isPopular ? colors.accent : colors.border,
                          backgroundColor: theme === 'dark' ? '#222' : '#e0e0e0',
                          opacity: 0.7,
                          transform: [{ scale: 0.97 }],
                          zIndex: 1,
                        },
                    { maxWidth: 180, minWidth: 150, marginHorizontal: 6, paddingHorizontal: 18, paddingVertical: 18 },
                  ]}
                  onPress={() => setSelectedPlan(pkg)}
                  activeOpacity={0.9}
                  disabled={isPurchasing}
                >
                  {isPopular && (
                    <View
                      style={[
                        styles.bestValueBadge,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bestValueText,
                          {
                            color:
                              theme === "dark" ? colors.black : colors.background,
                          },
                        ]}
                      >
                        {t("paywall.annual.save")}
                      </Text>
                    </View>
                  )}
                  <View style={styles.planContent}>
                    <Ionicons
                      name={isAnnual ? "sparkles-outline" : "calendar-outline"}
                      size={32}
                      color={isPopular ? colors.primary : colors.text}
                      style={styles.planIcon}
                    />
                    <Text style={[styles.planTitle, { color: colors.text }]}>
                      {pkg.product.title}
                    </Text>
                    <Text
                      style={[
                        styles.planPrice,
                        { color: isPopular ? colors.primary : colors.text },
                      ]}
                    >
                      {pkg.product.priceString}
                    </Text>
                    <Text style={[styles.planFrequency, { color: colors.accentGray }]}> 
                      {frequencyText}
                    </Text>
                    {pkg.product.introPrice && (() => {
                      const introPriceObj = pkg.product.introPrice;
                      let displayPeriod = "";
                      if (
                        introPriceObj.periodUnit &&
                        introPriceObj.periodNumberOfUnits
                      ) {
                        let numUnits = introPriceObj.periodNumberOfUnits;
                        let unit = introPriceObj.periodUnit.toLowerCase();
                        if (unit === "week") {
                          numUnits = numUnits * 7;
                          unit = "day";
                        }
                        displayPeriod = `${numUnits} ${unit}${numUnits > 1 ? "s" : ""}`;
                      }
                      let introText;
                      if (introPriceObj.price === 0) {
                        introText = t("paywall.introOfferFree", {
                          period: displayPeriod,
                        });
                      } else {
                        introText = t("paywall.introOfferPaid", {
                          price: introPriceObj.priceString,
                          period: displayPeriod,
                        });
                      }
                      return (
                        <Text
                          style={[
                            styles.introOfferText,
                            { color: colors.success },
                          ]}
                        >
                          {introText}
                        </Text>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* NOVO: Botão de confirmação só aparece se um plano estiver selecionado */}
        {selectedPlan && (
          <TouchableOpacity
            style={[
              styles.mainActionButton,
              { backgroundColor: colors.primary },
              isPurchasing && styles.disabledButton,
            ]}
            onPress={() => handleSelectPlan(selectedPlan)}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator
                color={theme === "dark" ? colors.black : colors.background}
              />
            ) : (
              <Text
                style={[
                  styles.mainActionButtonText,
                  {
                    color: theme === "dark" ? colors.black : colors.background,
                  },
                ]}
              >
                {t("paywall.chooseYourPlan", "Teste grátis")}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Adicionar links pequenos para EULA e Privacy Policy na parte inferior */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: colors.accentGray, textAlign: "center" }}>
            By continuing, you agree to our
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={() => {
                // Open Apple EULA
                Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/");
              }}
            > Terms of Use (EULA)</Text> and
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={() => {
                router.push("/privacy-policy");
              }}
            > Privacy Policy</Text>
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    // Estilo para centralizar conteúdo do loading/error
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    // flexGrow: 1, // Removido
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // borderBottomWidth: 1, // Adicionado para separação visual
  },
  mainHeaderContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    position: "absolute",
    bottom: 0, // Ajustado para alinhar no fundo do header animado
    left: 0,
    right: 0,
    paddingBottom: 20, // Espaçamento inferior
  },
  mainHeaderIcon: {
    marginBottom: 0, // Reduzido ou removido se o título estiver muito baixo
  },
  collapsedHeaderContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "absolute",
    top: 0, // Garantir que fique no topo
  },
  collapsedHeaderTitle: {
    fontSize: 28, // Ajustado para ser igual ao título principal
    fontWeight: "bold",
    marginTop: -10,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
  },
  videoPlaceholder: {
    width: "100%",
    alignSelf: "center",
    marginTop: 0, // Removido o marginTop, pois o paddingTop do ScrollView já cuida disso
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: "hidden",
    // backgroundColor: "#eee", // Removido para usar a cor dinâmica
  },
  video: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 14, // Mantido para espaçamento do ícone
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "85%",
    lineHeight: 22,
    fontFamily: "Inter-Regular", // Adicionado para consistência
  },
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Mantido, mas os cards terão flex: 1
    paddingHorizontal: 24,
    marginTop: 24, // Aumentado para dar espaço ao vídeo
  },
  planCard: {
    flex: 1, // Para que ocupem espaço igual
    borderRadius: 20, // Aumentado para um visual mais moderno
    padding: 16, // Ajustado
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 }, // Ajustado
    shadowOpacity: 0.12, // Ajustado
    shadowRadius: 10, // Ajustado
    elevation: 5, // Ajustado
    position: "relative",
    minHeight: 210, // Altura mínima para alinhar melhor
    justifyContent: "space-between", // Para distribuir conteúdo interno
    marginBottom: 10, // Adicionado para dar espaço ao botão de ação principal
  },
  planCardAnnual: {
    borderWidth: 1,
    // Outros estilos de destaque se necessário
  },
  bestValueBadge: {
    position: "absolute",
    top: -16, // Ajustado
    paddingHorizontal: 16, // Ajustado
    paddingVertical: 5, // Ajustado
    borderRadius: 10,
    zIndex: 1,
  },
  bestValueText: {
    fontWeight: "bold",
    fontSize: 14, // Aumentado um pouco
    fontFamily: "Anton-Regular",
  },
  planContent: {
    alignItems: "center",
    width: "100%", // Para garantir que o conteúdo centralize corretamente
  },
  planIcon: {
    marginVertical: 12, // Ajustado
  },
  planTitle: {
    fontSize: 24, // Ajustado
    fontWeight: "bold",
    marginBottom: 8, // Ajustado
    textAlign: "center",
    fontFamily: "Anton-Regular",
  },
  planPrice: {
    fontSize: 28, // Ajustado
    fontWeight: "900",
    marginBottom: 8, // Ajustado
    textAlign: "center",
  },
  planFrequency: {
    fontSize: 14, // Ajustado
    marginBottom: 8, // Ajustado
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  restoreButton: {
    paddingVertical: 8, // Aumentado
    alignItems: "center",
    marginBottom: 24,
    marginHorizontal: 24,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    // Estilo para o botão Tentar Novamente
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  introOfferText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  mainActionButton: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
    marginTop: 10, // Espaço acima do botão
    marginBottom: 10, // Espaço abaixo do botão
    minHeight: 50, // Altura mínima para o ActivityIndicator
  },
  mainActionButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Anton-Regular",
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Stepper Styles
  stepperContainer: {
    paddingHorizontal: 18,
    marginTop: 24,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepIconContainer: {
    alignItems: "center",
    marginRight: 15,
    paddingTop: 8, // Descendo um pouco os círculos com ícones
  },
  stepIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLineContainer: {
    alignItems: "center",
    height: 40,
    overflow: "hidden",
  },
  stepLine: {
    width: 3,
    height: "200%",
    borderRadius: 3,
  },
  stepTextContainer: {
    flex: 1,
    paddingTop: 10, // Ajustado para alinhar melhor com os ícones
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: "Anton-Regular",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepCardContainer: {
    marginTop: 10,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2.22,
    elevation: 3,
  },
  stepCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepCardText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
  },
  // Estilos para o BottomSheet
  bottomSheetContentContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  bottomSheetTitle: {
    fontSize: 48,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    marginBottom: 30,
  },
  plansContainerBS: {
    // Estilo para o container de planos DENTRO do BottomSheet
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%", // Ocupar toda a largura
    paddingBottom: 20, // Espaço na parte inferior do sheet
  },
  planCardBS: {
    // Estilo para os cards DENTRO do BottomSheet
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
    minHeight: 210, // Pode ser um pouco menor
    justifyContent: "space-between",
    marginHorizontal: 6, // Espaçamento entre cards no sheet
  },
  planCardAnnualBS: {
    // Estilo para o card anual DENTRO do BottomSheet
    borderWidth: 0.5,
  },
  loaderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

// Otimizações implementadas para o vídeo:
// 1. Pré-carregamento com Asset.fromModule para carregar antes da renderização
// 2. Desmontagem do componente de vídeo quando não visível para economizar recursos
// 3. Loader visual durante o carregamento
// 4. Controle de estado para melhor gerenciamento do ciclo de vida do vídeo
// 5. Melhor tratamento de erros e eventos de carregamento
