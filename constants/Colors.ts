const tintColorLight = "#1c9abe"; // Azul principal
const tintColorDark = "#1c9abe"; // Mesmo azul para dark mode

export default {
  light: {
    text: "#333333", // Cinza escuro para texto
    background: "#FFFFFF", // Fundo branco
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    primary: "#1c9abe", // Azul principal
    secondary: "#333333", // Cinza escuro
    accent: "#00BFFF", // Azul claro
    success: "#4BB543", // Verde
    danger: "#FF0000", // Vermelho
    warning: "#FFC107", // Amarelo
    info: "#0096FF", // Azul
    light: "#F8F9FA", // Cinza muito claro para cards
    dark: "#212121", // Quase preto
    border: "#E9ECEF", // Borda sutil
    card: "#FFFFFF", // Cor para cards
  },
  dark: {
    text: "#F8F9FA", // Texto claro
    background: "#121212", // Fundo escuro
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    primary: "#1c9abe", // Azul principal
    secondary: "#E0E0E0", // Cinza claro
    accent: "#00BFFF", // Azul claro
    success: "#4BB543", // Verde
    danger: "#FF0000", // Vermelho
    warning: "#FFC107", // Amarelo
    info: "#0096FF", // Azul
    light: "#1E1E1E", // Cinza escuro para cards
    dark: "#121212", // Quase preto
    border: "#333333", // Borda sutil para dark mode
    card: "#1E1E1E", // Cor para cards em modo escuro
  },
};
