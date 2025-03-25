const tintColorLight = "#2A2A2A"; // Preto suave principal
const tintColorDark = "#F7F7F7"; // Branco suave para dark mode

export default {
  light: {
    text: "#2A2A2A", // Preto suave
    background: "#FFFFFF", // Fundo branco puro
    tint: tintColorLight,
    tabIconDefault: "#CCCCCC",
    tabIconSelected: tintColorLight,
    primary: "#1E1E1E", // Preto intenso
    black: "#000000",
    secondary: "#4A4A4A", // Cinza escuro
    accent: "#6C63FF", // Roxo suave
    success: "#3ECF8E", // Verde menta
    danger: "#FF6B6B", // Vermelho coral
    warning: "#FFD166", // Amarelo suave
    info: "#4ECDC4", // Turquesa
    light: "#F9F9F9", // Branco levemente off-white
    dark: "#212121", // Quase preto
    border: "#EFEFEF", // Borda mais subtil
    card: "rgba(0,0,0,0.02)", // Cor para cards mais sutil

    // Cores específicas para gráficos
    chartBackground: "rgba(108, 99, 255, 0.05)", // Roxo bem clarinho
    chartGradientStart: "#F5F4FF", // Lilás clarinho
    chartGradientEnd: "#FFFFFF", // Branco para gradiente final
    chartGrid: "#EEEEEE", // Cinza claro para linhas de grade
    chartDotFill: "#FFFFFF", // Branco para preenchimento dos pontos
  },
  dark: {
    text: "#F7F7F7", // Branco suave
    background: "#121212", // Fundo escuro
    tint: tintColorDark,
    tabIconDefault: "#8A8A8A",
    tabIconSelected: tintColorDark,
    primary: "#e5e5e5", // Branco acinzentado
    black: "#000000",
    secondary: "#BDBDBD", // Cinza claro
    accent: "#7B73FF", // Roxo mais brilhante
    success: "#4DD8A5", // Verde menta mais brilhante
    danger: "#FF6B6B", // Vermelho coral mais suave
    warning: "#FFE066", // Amarelo mais suave
    info: "#5DDED6", // Turquesa mais brilhante
    light: "#1E1E1E", // Cinza escuro para cards
    dark: "#0A0A0A", // Preto profundo
    border: "#2A2A2A", // Borda mais definida
    card: "rgba(255,255,255,0.03)", // Cor para cards em modo escuro

    // Cores específicas para gráficos
    chartBackground: "rgba(123, 115, 255, 0.1)", // Roxo escuro para fundo
    chartGradientStart: "#2A2730", // Roxo escuro para gradiente inicial
    chartGradientEnd: "#1A1A1A", // Cinza escuro para gradiente final
    chartGrid: "#2C2C2C", // Cinza médio para linhas de grade
    chartDotFill: "#121212", // Cor escura para preenchimento dos pontos
  },
};
