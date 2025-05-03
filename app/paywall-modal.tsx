import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView, MotiText } from "moti";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import Colors from "../constants/Colors";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/common/Button";
import Purchases from "react-native-purchases";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  "paywall.features.feature1",
  "paywall.features.feature2",
  "paywall.features.feature3",
  "paywall.features.feature4",
  "paywall.features.feature5",
];

export default function PaywallModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasePending, setPurchasePending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Inicializa o RevenueCat em modo de debug para desenvolvimento
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
      console.log("RevenueCat em modo de depuração VERBOSE");
    }
    
    // Carrega os pacotes disponíveis na inicialização
    const loadOfferings = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("Tentando buscar offerings do RevenueCat...");
        
        const offerings = await Purchases.getOfferings();
        console.log("Offerings completo:", JSON.stringify(offerings, null, 2));
        
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          console.log("Offering atual:", offerings.current.identifier);
          console.log("Pacotes disponíveis:", offerings.current.availablePackages.length);
          
          offerings.current.availablePackages.forEach((pkg, index) => {
            console.log(`Pacote ${index + 1}:`, {
              identifier: pkg.identifier,
              packageType: pkg.packageType,
              product: {
                identifier: pkg.product.identifier,
                price: pkg.product.price,
                priceString: pkg.product.priceString,
                title: pkg.product.title,
                description: pkg.product.description
              }
            });
          });
          
          console.log("Pacotes disponíveis encontrados, configurando UI...");
          setPackages(offerings.current.availablePackages);
          
          // Selecionar o pacote anual por padrão (normalmente é o melhor valor)
          const annualPackage = offerings.current.availablePackages.find(
            pkg => pkg.packageType === "ANNUAL"
          );
          if (annualPackage) {
            console.log("Pacote anual selecionado por padrão:", annualPackage.identifier);
            setSelectedPackage(annualPackage.identifier);
          } else {
            console.log("Pacote anual não encontrado, selecionando primeiro pacote:", 
              offerings.current.availablePackages[0].identifier);
            setSelectedPackage(offerings.current.availablePackages[0].identifier);
          }
        } else {
          console.log("Nenhum pacote disponível no offering atual");
          setError(t("paywall.errors.noPackages"));
        }
      } catch (e: any) {
        console.error("Erro ao carregar ofertas:", e);
        console.error("Detalhes do erro:", e.message);
        if (e.underlyingErrorMessage) {
          console.error("Erro subjacente:", e.underlyingErrorMessage);
        }
        if (e.readableErrorCode) {
          console.error("Código de erro legível:", e.readableErrorCode);
        }
        setError(t("paywall.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadOfferings();
  }, [t]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      setPurchasePending(true);
      setError("");

      // Encontrar o pacote selecionado
      const packageToPurchase = packages.find(pkg => pkg.identifier === selectedPackage);
      
      if (!packageToPurchase) {
        setError(t("paywall.errors.packageNotFound"));
        return;
      }

      console.log("Comprando pacote:", packageToPurchase);

      // Realizar a compra
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log("Info do cliente após compra:", customerInfo);
      
      // Verificar se a compra foi bem-sucedida (verificando o entitlement "Pro")
      if (customerInfo.entitlements.active["Pro"]) {
        // Assinatura ativada com sucesso
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Fechar o modal e navegar para tabs
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      console.error("Erro na compra:", e);
      // Usuário cancelou ou erro ocorreu
      if (!e.userCancelled) {
        setError(t("paywall.errors.purchaseFailed"));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setPurchasePending(false);
    }
  };

  const startFreeTrial = async () => {
    if (!selectedPackage) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await handlePurchase();
  };

  const restorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      setLoading(true);
      setError("");
      
      const customerInfo = await Purchases.restorePurchases();
      console.log("Info do cliente após restauração:", customerInfo);
      
      if (customerInfo.entitlements.active["Pro"]) {
        // Assinatura restaurada com sucesso
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Fechar o modal e navegar para tabs
        router.replace("/(tabs)");
      } else {
        setError(t("paywall.errors.noSubscriptionsFound"));
      }
    } catch (e) {
      console.error("Erro na restauração:", e);
      setError(t("paywall.errors.restoreFailed"));
    } finally {
      setLoading(false);
    }
  };

  const renderPackageOption = (pkg: any) => {
    const isAnnual = pkg.packageType === "ANNUAL";
    const isSelected = selectedPackage === pkg.identifier;
    
    // Calcular desconto para plano anual (se aplicável)
    let discount = null;
    if (isAnnual && packages.length > 1) {
      const monthlyPackage = packages.find(p => p.packageType === "MONTHLY");
      if (monthlyPackage) {
        const monthlyAnnualized = monthlyPackage.product.price * 12;
        const annualPrice = pkg.product.price;
        const savingsPercent = Math.round(((monthlyAnnualized - annualPrice) / monthlyAnnualized) * 100);
        if (savingsPercent > 0) {
          discount = savingsPercent;
        }
      }
    }
    
    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.packageOption,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected 
              ? colors.primary + '15'  // 15% de opacidade
              : theme === "dark" 
                ? colors.card
                : colors.background,
          }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedPackage(pkg.identifier);
        }}
      >
        {discount !== null && (
          <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.discountText}>
              {t("paywall.savePercent", { percent: discount })}
            </Text>
          </View>
        )}
        
        <Text 
          style={[
            styles.packageTitle, 
            { 
              color: colors.text,
              fontWeight: isSelected ? 'bold' : 'normal' 
            }
          ]}
        >
          {isAnnual ? t("paywall.annual") : t("paywall.monthly")}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.currencySymbol, { color: colors.text }]}>
            {pkg.product.priceString.charAt(0)}
          </Text>
          <Text style={[styles.priceAmount, { color: colors.text }]}>
            {pkg.product.priceString.substring(1)}
          </Text>
        </View>
        
        <Text style={[styles.billingPeriod, { color: colors.secondary }]}>
          {isAnnual 
            ? t("paywall.billedAnnually") 
            : t("paywall.billedMonthly")}
        </Text>
        
        {isSelected && (
          <Ionicons 
            name="egg" 
            size={24} 
            color={colors.primary} 
            style={styles.checkmark} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header com Título e Subtítulo */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("paywall.title")}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t("paywall.subtitle")}
          </Text>
        </MotiView>
        
        {/* Banner destaque para trial */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 200 }}
          style={[
            styles.trialBanner,
            { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary
            }
          ]}
        >
          <Ionicons name="time-outline" size={28} color={theme === "dark" ? "#000" : "#fff"} />
          <Text style={[
            styles.trialText,
            { color: theme === "dark" ? "#000" : "#fff" }
          ]}>
            {t("paywall.trialOffer")}
          </Text>
        </MotiView>
        
        {/* Lista de recursos principais */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 800, delay: 300 }}
          style={styles.featuresContainer}
        >
          {FEATURES.map((feature, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ 
                type: "timing", 
                duration: 400, 
                delay: 400 + (index * 100) 
              }}
              style={styles.featureItem}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={colors.primary} 
                style={styles.featureIcon} 
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t(feature)}
              </Text>
            </MotiView>
          ))}
        </MotiView>
        
        {/* Opções de pacotes */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>
              {t("paywall.loading")}
            </Text>
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 600 }}
            style={styles.packagesContainer}
          >
            {packages.map(pkg => renderPackageOption(pkg))}
          </MotiView>
        )}
        
        {/* Mensagem de erro */}
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
        
        {/* Botão de iniciar trial */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 800 }}
          style={styles.actionButtonContainer}
        >
          <Button
            title={t("paywall.startTrialButton")}
            onPress={startFreeTrial}
            style={{ backgroundColor: colors.primary }}
            loading={purchasePending}
            disabled={loading || purchasePending || !selectedPackage}
          />
          
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={restorePurchases}
            disabled={loading || purchasePending}
          >
            <Text style={[styles.restoreText, { color: colors.secondary }]}>
              {t("paywall.restorePurchases")}
            </Text>
          </TouchableOpacity>
        </MotiView>
        
        {/* Texto de política de privacidade e termos */}
        <Text style={[styles.termsText, { color: colors.secondary }]}>
          {t("paywall.termsText")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: "90%",
    lineHeight: 22,
  },
  trialBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginVertical: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  trialText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  packagesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  packageOption: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 150,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  billingPeriod: {
    fontSize: 12,
    textAlign: "center",
  },
  discountBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  actionButtonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  restoreButton: {
    alignItems: "center",
    padding: 12,
  },
  restoreText: {
    fontSize: 14,
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
}); 