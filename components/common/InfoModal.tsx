import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

export interface InfoItem {
  title: string;
  description: string;
  icon?: string;
  iconType?: "ionicons" | "material";
  color?: string;
}

interface InfoModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  infoItems: InfoItem[];
  onClose: () => void;
  closeButtonText?: string;
  topIcon?: {
    name: string;
    type?: "ionicons" | "material";
    color?: string;
    backgroundColor?: string;
  };
}

const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  subtitle,
  infoItems,
  onClose,
  closeButtonText,
  topIcon,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Renderizar o ícone adequado com base no tipo
  const renderIcon = (
    iconName: string,
    iconType: "ionicons" | "material" = "ionicons",
    iconColor: string = colors.primary,
    size: number = 24
  ) => {
    if (iconType === "material") {
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={size}
          color={iconColor}
        />
      );
    } else {
      return <Ionicons name={iconName as any} size={size} color={iconColor} />;
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={
            theme === "dark"
              ? ["rgba(0, 0, 0, 0.95)", "rgba(26, 25, 25, 0.97)"]
              : ["rgba(245, 245, 255, 0.97)", "rgba(255, 255, 255, 0.99)"]
          }
          style={styles.modalGradient}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.light,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {title}
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={handleClose}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.text + "99"}
                />
              </TouchableOpacity>
            </View>

            {/* Ícone superior (se fornecido) */}
            {topIcon && (
              <View style={styles.topIconContainer}>
                <View
                  style={[
                    styles.iconBackground,
                    {
                      backgroundColor:
                        topIcon.backgroundColor || colors.primary + "20",
                    },
                  ]}
                >
                  {renderIcon(
                    topIcon.name,
                    topIcon.type || "ionicons",
                    topIcon.color || colors.primary,
                    32
                  )}
                </View>
              </View>
            )}

            {/* Subtítulo (se fornecido) */}
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.text + "99" }]}>
                {subtitle}
              </Text>
            )}

            {/* Conteúdo rolável */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {infoItems.map((item, index) => (
                <View
                  key={`info-item-${index}`}
                  style={[
                    styles.infoItem,
                    index === infoItems.length - 1 && { marginBottom: 0 },
                  ]}
                >
                  {item.icon && (
                    <View
                      style={[
                        styles.formulaIconContainer,
                        {
                          backgroundColor: item.color
                            ? item.color + "20"
                            : colors.primary + "20",
                        },
                      ]}
                    >
                      {renderIcon(
                        item.icon,
                        item.iconType,
                        item.color || colors.primary,
                        20
                      )}
                    </View>
                  )}
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.infoDescription,
                        { color: colors.text + "99" },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Botão de fechar na parte inferior */}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  theme === "dark" && { color: "#000000" },
                ]}
              >
                {closeButtonText || t("common.gotIt")}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  modalBody: {
    maxHeight: "60%",
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  formulaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default InfoModal;
