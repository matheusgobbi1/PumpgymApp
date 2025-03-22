import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNutrition } from "../../context/NutritionContext";
import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  onSettingsPress?: () => void;
  onEditProfilePress?: () => void;
}

export default function ProfileHeader({
  onSettingsPress,
  onEditProfilePress,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { nutritionInfo } = useNutrition();

  // Controle de animação - executar apenas uma vez
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);

  // Configurar a animação para ser executada apenas na primeira renderização
  if (!animationExecuted.current) {
    setShouldAnimate(true);
    animationExecuted.current = true;
  } else if (shouldAnimate) {
    setShouldAnimate(false);
  }

  // Função para formatar o nome do usuário (primeira letra maiúscula)
  const formatName = (name: string | null | undefined) => {
    if (!name) return t("profile.header.user");

    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  // Função para determinar o status do plano nutricional
  const getNutritionStatus = () => {
    if (!nutritionInfo.calories) {
      return t("profile.header.planNotConfigured");
    }

    // Verificar se o usuário completou o onboarding
    if (
      nutritionInfo.gender &&
      nutritionInfo.height &&
      nutritionInfo.weight &&
      nutritionInfo.goal
    ) {
      return t("profile.header.planActive");
    }

    return t("profile.header.planIncomplete");
  };

  // Função para obter a primeira letra do nome para o avatar
  const getInitial = () => {
    const name = user?.displayName || user?.email?.split("@")[0] || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <MotiView
      from={
        shouldAnimate
          ? { opacity: 0, translateY: -5 }
          : { opacity: 1, translateY: 0 }
      }
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      style={styles.container}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfoContainer}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{getInitial()}</Text>
            )}
          </View>

          <View style={styles.userTextInfo}>
            <Text
              style={[styles.userName, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatName(user?.displayName || user?.email?.split("@")[0])}
            </Text>
            <Text
              style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.email || ""}
            </Text>

            <View style={styles.nutritionStatusContainer}>
              <Text style={[styles.nutritionStatus, { color: colors.primary }]}>
                {getNutritionStatus()}
              </Text>
            </View>
          </View>
        </View>

        {onSettingsPress && (
          <TouchableOpacity
            onPress={onSettingsPress}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.text}
              style={{ opacity: 0.7 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  userTextInfo: {
    flex: 1,
    flexShrink: 1,
    overflow: "hidden",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  nutritionStatusContainer: {
    marginTop: 4,
  },
  nutritionStatus: {
    fontSize: 13,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 8,
  },
});
