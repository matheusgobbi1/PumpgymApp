const tintColorLight = "#333"; // Azul principal
const tintColorDark = "#fffff4"; // Mesmo azul para dark mode

export default {
  light: {
    text: "#333333", // Cinza escuro para texto
    background: "#FFFFFF", // Fundo branco
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    primary: "#000000", // Cor preta (botão principal, ícones etc.)
    secondary: "#333333", // Cinza escuro
    accent: "#00BFFF", // Azul claro
    success: "#4BB543", // Verde
    danger: "#FF0000", // Vermelho
    warning: "#FFC107", // Amarelo
    info: "#0096FF", // Azul
    light: "#F8F9FA", // Cinza muito claro para cards
    dark: "#212121", // Quase preto
    border: "#E9ECEF", // Borda sutil
    card: "rgba(0,0,0,0.03)", // Cor para cards

    // Cores específicas para gráficos
    chartBackground: "60", // Azul bem clarinho para fundo
    chartGradientStart: "#e6f2ff", // Azul clarinho para gradiente inicial
    chartGradientEnd: "#f5faff", // Azul mais claro para gradiente final
    chartGrid: "#d0e1f9", // Azul suave para linhas de grade
    chartDotFill: "#FFFFFF", // Branco para preenchimento dos pontos
  },
  dark: {
    text: "#F8F9FA", // Texto claro
    background: "#121212", // Fundo escuro
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    primary: "#BBBBBB", // Cinza médio (botão principal, ícones etc.)
    secondary: "#E0E0E0", // Cinza claro
    accent: "#00BFFF", // Azul claro
    success: "#4BB543", // Verde
    danger: "#FF0000", // Vermelho
    warning: "#FFC107", // Amarelo
    info: "#0096FF", // Azul
    light: "#1E1E1E", // Cinza escuro para cards
    dark: "#121212", // Quase preto
    border: "#333333", // Borda sutil para dark mode
    card: "rgba(255,255,255,0.05)", // Cor para cards em modo escuro

    // Cores específicas para gráficos
    chartBackground: "60", // Azul escuro para fundo
    chartGradientStart: "#1E1E1E", // Azul mais escuro para gradiente inicial
    chartGradientEnd: "#f5faff", // Azul um pouco mais claro para gradiente final
    chartGrid: "#2c3e50", // Azul médio para linhas de grade
    chartDotFill: "#121212", // Cor escura para preenchimento dos pontos
  },
};
