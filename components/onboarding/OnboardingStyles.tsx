import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Constantes para espaçamento e tamanhos padronizados
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Constantes para tamanhos de fonte
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
};

// Estilos comuns para todas as telas de onboarding
export const onboardingStyles = StyleSheet.create({
  // Container para as opções (usado em várias telas)
  optionsContainer: {
    marginTop: SPACING.md,
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },

  // Container para as opções que ficam em grade
  gridOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    width: "100%",
  },

  // Estilos para opções em grid (2 colunas)
  gridOption: {
    width: (width - SPACING.lg * 3) / 2, // Duas colunas com espaçamento
    marginBottom: SPACING.md,
    aspectRatio: 1.2, // Proporção consistente
    borderRadius: 12,
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },

  // Container para formulários (inputs, etc)
  formContainer: {
    width: "100%",
    marginTop: SPACING.lg,
  },

  // Estilos para campos de entrada
  inputContainer: {
    marginBottom: SPACING.lg,
    width: "100%",
  },

  // Botão secundário
  secondaryButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    width: "100%",
    alignItems: "center",
  },

  // Texto do botão secundário
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
  },

  // Espaçador vertical
  spacer: {
    height: SPACING.md,
  },

  // Container centralizado verticalmente
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },

  // Container para imagens ou ícones
  imageContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },

  // Estilo para textos informativos
  infoText: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    opacity: 0.7,
    paddingHorizontal: SPACING.md,
  },
});

export default {
  SPACING,
  FONT_SIZES,
  onboardingStyles,
};
