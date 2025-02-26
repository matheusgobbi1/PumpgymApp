import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // O redirecionamento para a tela de login é feito dentro da função logout
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer logout. Tente novamente.");
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Bem-vindo ao PumpGym
      </Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Seu aplicativo de treino e dieta personalizado
      </Text>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.tint }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
