const tintColorLight = "#1A1A1A"; // Preto principal
const tintColorDark = "#FFFFFF"; // Branco principal

export default {
  light: {
    text: "#1A1A1A", // Preto suave para texto
    background: "#FFFFFF", // Fundo branco puro
    tint: tintColorLight,
    tabIconDefault: "#DADADA",
    tabIconSelected: tintColorLight,
    primary: "#1A1A1A", // Preto principal
    black: "#000000",
    secondary: "#4A4A4A", // Cinza escuro
    accent: "#6C63FF", // Mantendo roxo como cor de destaque
    accentGray: "#1A1A1A", // Cinza Azulado Médio (mais escuro para light theme)
    success: "#2ECE8D", // Verde mais vibrante
    danger: "#E53935", // Vermelho principal atualizado
    error: "#E53935", // Adicionado cor de erro (usando a mesma cor de perigo)
    warning: "#FFB74D", // Laranja âmbar
    info: "#FFEDA8", // Amarelo suave
    light: "#F8F9FA", // Branco levemente acinzentado
    dark: "#212529", // Preto suave
    border: "#rgb(241, 241, 241)", // Borda mais visível para o tema claro
    tabborder: "#rgb(224, 224, 224)", // Borda mais visível para o tema escuro
    card: "rgba(0, 0, 0, 0.02)", // Card com sombra sutil

    // Cores para gráficos com base monocromática
    chartBackground: "rgba(26, 26, 26, 0.03)",
    chartGradientStart: "#F8F9FA",
    chartGradientEnd: "#FFFFFF",
    chartGrid: "#EAEAEA",
    chartDotFill: "#FFFFFF",
  },
  dark: {
    text: "#e9e2e2", // Branco puro para texto
    background: "#121212", // Fundo escuro
    tint: tintColorDark,
    tabIconDefault: "#404040", // Cinza mais escuro para ícones inativos
    tabIconSelected: tintColorDark,
    primary: "#e9e2e2", // Branco levemente acinzentado como cor principal
    black: "#000000",
    secondary: "#8A8A8A", // Cinza médio para melhor contraste
    accent: "#8B7FFF", // Roxo mais suave
    accentGray: "#B0BEC5", // Cinza Azulado Claro
    success: "#4AE3A8", // Verde néon suave
    danger: "#E53935", // Vermelho principal atualizado
    error: "#E53935", // Adicionado cor de erro (usando a mesma cor de perigo)
    warning: "#FFC857", // Amarelo mais quente
    info: "#FFE082", // Amarelo suave néon
    light: "#181818", // Cinza mais escuro para cards
    dark: "#0A0A0A", // Preto profundo
    border: "#rgba(255, 255, 255, 0.03)", // Borda mais visível para o tema escuro
    tabborder: "#rgba(255, 255, 255, 0.05)", // Borda mais visível para o tema escuro
    card: "rgba(255, 255, 255, 0.05)", // Card com brilho sutil

    // Cores para gráficos com base monocromática
    chartBackground: "rgba(255, 255, 255, 0.07)", // Aumentei opacidade
    chartGradientStart: "#333333", // Cinza mais escuro
    chartGradientEnd: "#121212",
    chartGrid: "#333333", // Cinza mais escuro para grade
    chartDotFill: "#121212",
  },
};
