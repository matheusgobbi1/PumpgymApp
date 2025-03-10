import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MotiView } from "moti";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import Constants from "expo-constants";
import ConfirmationModal from "../ui/ConfirmationModal";

interface ProfileOptionsCardProps {
  onThemeToggle: () => void;
  onNotificationsPress?: () => void;
  onPrivacyPress?: () => void;
  onAboutPress?: () => void;
  onHelpPress?: () => void;
}

export default function ProfileOptionsCard({ 
  onThemeToggle, 
  onNotificationsPress = () => {},
  onPrivacyPress = () => {},
  onAboutPress = () => {},
  onHelpPress = () => {}
}: ProfileOptionsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signOut } = useAuth();
  
  // Estado para controlar a visibilidade do modal de confirmação
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // Controle de animação - executar apenas uma vez
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);
  
  useEffect(() => {
    // Configurar a animação para ser executada apenas na primeira renderização
    if (!animationExecuted.current) {
      setShouldAnimate(true);
      animationExecuted.current = true;
    } else {
      setShouldAnimate(false);
    }
  }, []);
  
  // Versão do aplicativo
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  
  // Função para mostrar o modal de confirmação de logout
  const showLogoutConfirmation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLogoutModalVisible(true);
  };
  
  // Função para lidar com o logout
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <MotiView
      from={shouldAnimate ? { opacity: 0, translateY: 10 } : { opacity: 1, translateY: 0 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: 200 }}
      style={styles.container}
    >
      {/* Opções do Perfil */}
      <View style={[styles.optionsContainer, { backgroundColor: colors.light}]}>
        {/* Notificações */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNotificationsPress();
          }}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Notificações</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '50'} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Privacidade e Segurança */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPrivacyPress();
          }}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Privacidade e Segurança</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '50'} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Sobre Nós */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAboutPress();
          }}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Sobre Nós</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '50'} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Ajuda e Suporte */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onHelpPress();
          }}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>Ajuda e Suporte</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '50'} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Alternar Tema */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onThemeToggle();
          }}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: theme === 'dark' ? '#FFD16615' : '#6C757D15' }]}>
            <Ionicons 
              name={theme === 'dark' ? "sunny-outline" : "moon-outline"} 
              size={20} 
              color={theme === 'dark' ? "#FFD166" : "#6C757D"} 
            />
          </View>
          <Text style={[styles.optionText, { color: colors.text }]}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Text>
          <View style={[styles.themeToggle, { backgroundColor: colors.primary + '20' }]}>
            <View style={[
              styles.themeToggleIndicator, 
              { 
                backgroundColor: colors.primary,
                alignSelf: theme === 'dark' ? 'flex-end' : 'flex-start'
              }
            ]} />
          </View>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Sair */}
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={showLogoutConfirmation}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: '#EF476F15' }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF476F" />
          </View>
          <Text style={[styles.optionText, { color: '#EF476F' }]}>Sair</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '50'} />
        </TouchableOpacity>
      </View>
      
      {/* Rodapé com informações do app */}
      <View style={styles.footerContainer}>
        <Text style={[styles.appName, { color: colors.text + '60' }]}>
          FitFolio
        </Text>
        <Text style={[styles.appVersion, { color: colors.text + '40' }]}>
          Versão {appVersion}
        </Text>
      </View>
      
      {/* Modal de confirmação de logout */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Sair da conta"
        message="Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar seus dados."
        confirmText="Sair"
        cancelText="Cancelar"
        confirmType="danger"
        icon="log-out-outline"
        onConfirm={() => {
          setLogoutModalVisible(false);
          handleLogout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.1,
  },
  themeToggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  themeToggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  appVersion: {
    fontSize: 12,
    marginTop: 2,
  },
}); 