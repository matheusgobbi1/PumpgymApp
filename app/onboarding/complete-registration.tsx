import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MotiView, MotiText } from "moti";
import {
  validateRegistration,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
} from "../../utils/validations";

const { width } = Dimensions.get("window");

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { completeAnonymousRegistration, isAnonymous } = useAuth();

  useEffect(() => {
    if (!isAnonymous) {
      router.replace("/(tabs)");
    }
  }, [isAnonymous, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const calculatePasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 0.25;
    if (/[A-Z]/.test(pass)) strength += 0.25;
    if (/[0-9]/.test(pass)) strength += 0.25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 0.25;
    return strength;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 0.25) return "#FF5252";
    if (passwordStrength <= 0.5) return "#FFC107";
    if (passwordStrength <= 0.75) return "#2196F3";
    return "#4CAF50";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 0.25) return "Fraca";
    if (passwordStrength <= 0.5) return "Média";
    if (passwordStrength <= 0.75) return "Boa";
    return "Forte";
  };

  const handleCompleteRegistration = async () => {
    const validationResult = validateRegistration(
      name,
      email,
      password,
      confirmPassword
    );
    if (!validationResult.isValid) {
      setError(validationResult.message);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await completeAnonymousRegistration(name, email, password);
    } catch (err: any) {
      console.error("Erro ao completar registro:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este email já está em uso. Por favor, use outro email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Email inválido");
      } else if (err.code === "auth/weak-password") {
        setError("Senha muito fraca");
      } else {
        setError("Ocorreu um erro ao completar o registro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, "#333"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <MotiText
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 300 }}
                style={styles.title}
              >
                Complete seu cadastro
              </MotiText>
              <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ type: "timing", delay: 500, duration: 800 }}
                style={styles.subtitle}
              >
                Crie sua conta para salvar seu progresso e acessar recursos
                exclusivos.
              </MotiText>
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 600 }}
              style={[
                styles.formCard,
                {
                  backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "white",
                },
              ]}
            >
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF5252" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Input
                    label="Nome"
                    placeholder="Seu nome completo"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    onFocus={() => setActiveField("name")}
                    onBlur={() => setActiveField("")}
                    leftIcon="person-outline"
                    isActive={activeField === "name"}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Input
                    label="Email"
                    placeholder="Seu email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField("")}
                    leftIcon="mail-outline"
                    isActive={activeField === "email"}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Input
                    label="Senha"
                    placeholder="Sua senha"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    onFocus={() => setActiveField("password")}
                    onBlur={() => setActiveField("")}
                    leftIcon="lock-closed-outline"
                    isActive={activeField === "password"}
                  />
                </View>

                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.strengthBarContainer}>
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            width: `${passwordStrength * 100}%`,
                            backgroundColor: getPasswordStrengthColor(),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        { color: getPasswordStrengthColor() },
                      ]}
                    >
                      {getPasswordStrengthText()}
                    </Text>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Input
                    label="Confirmar Senha"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    onFocus={() => setActiveField("confirmPassword")}
                    onBlur={() => setActiveField("")}
                    leftIcon="shield-checkmark-outline"
                    isActive={activeField === "confirmPassword"}
                  />
                </View>

                <Button
                  title="CRIAR MINHA CONTA"
                  onPress={handleCompleteRegistration}
                  loading={loading}
                  style={styles.registerButton}
                />

                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    Ao criar uma conta, você concorda com nossos{" "}
                    <Text style={styles.termsLink}>Termos de Serviço</Text> e{" "}
                    <Text style={styles.termsLink}>
                      Política de Privacidade
                    </Text>
                  </Text>
                </View>
              </View>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainer: {
    width: "100%",
    gap: 16,
  },
  inputWrapper: {
    width: "100%",
  },
  passwordStrengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 8,
  },
  strengthBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
  },
  strengthText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#FF5252",
    marginLeft: 8,
    flex: 1,
    fontSize: 12,
  },
  registerButton: {
    height: 48,
    borderRadius: 24,
    marginTop: 8,
  },
  termsContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: "#4ecdc4",
    fontWeight: "bold",
  },
});
