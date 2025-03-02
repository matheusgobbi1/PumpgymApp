import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // O redirecionamento para a tela de login é feito dentro da função signOut
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

      {/* Botão para alternar tema */}
      <TouchableOpacity
        style={[styles.themeButton, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
      >
        <Ionicons 
          name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} 
          size={20} 
          color="white" 
          style={styles.themeIcon}
        />
        <Text style={styles.themeButtonText}>
          {theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        </Text>
      </TouchableOpacity>

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
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  themeIcon: {
    marginRight: 8,
  },
  themeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
