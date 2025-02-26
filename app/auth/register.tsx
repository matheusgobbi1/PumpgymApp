import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import CustomModal from "../../components/CustomModal";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { register, checkEmailStatus, login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

  const handleEmailExists = () => {
    setShowEmailExistsModal(true);
  };

  const handleLoginWithExistingEmail = async () => {
    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        setError("Senha incorreta");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
      setShowEmailExistsModal(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Verificar se o email já existe
      const { exists } = await checkEmailStatus(email);

      if (exists) {
        handleEmailExists();
        return;
      }

      await register(name, email, password);
      // O redirecionamento será feito automaticamente pelo AuthProvider
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      if (
        err.message ===
          "Este email já está cadastrado. Por favor, faça login." ||
        err.code === "auth/email-already-in-use"
      ) {
        handleEmailExists();
      } else if (err.code === "auth/invalid-email") {
        setError("Email inválido");
      } else if (err.code === "auth/weak-password") {
        setError("Senha muito fraca");
      } else {
        setError("Ocorreu um erro ao registrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.primary }]}>PumpGym</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Crie sua conta
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Nome"
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="Seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirmar Senha"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Cadastrar"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={{ color: colors.text }}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Faça login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomModal
          visible={showEmailExistsModal}
          title="Email já cadastrado"
          message="Este email já está cadastrado. Deseja fazer login e continuar o cadastro?"
          primaryButtonText="Sim, fazer login"
          secondaryButtonText="Não, voltar"
          onPrimaryPress={handleLoginWithExistingEmail}
          onSecondaryPress={() => setShowEmailExistsModal(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  registerButton: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
});
