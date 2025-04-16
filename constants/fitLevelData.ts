import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface FitLevel {
  level: number;
  title: string;
  pointsRequired: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  description: string;
}

// Definição dos níveis fitness e ícones associados
export const FIT_LEVELS: FitLevel[] = [
  {
    level: 1,
    title: "Frango",
    pointsRequired: 0,
    icon: "food-drumstick-outline",
    color: "#9E9E9E", // Cinza
    description: "Acabou de entrar na academia e ainda não tem experiência.",
  },
  {
    level: 2,
    title: "Calouro",
    pointsRequired: 50,
    icon: "dumbbell",
    color: "#66BB6A", // Verde claro
    description: "Está aprendendo os movimentos básicos.",
  },
  {
    level: 3,
    title: "Rato de Academia",
    pointsRequired: 100,
    icon: "rodent",
    color: "#42A5F5", // Azul claro
    description: "Está criando o hábito de treinar regularmente.",
  },
  {
    level: 4,
    title: "Novato Dedicado",
    pointsRequired: 200,
    icon: "clock-time-four",
    color: "#5C6BC0", // Azul índigo
    description: "Está descobrindo sua rotina ideal de treinos.",
  },
  {
    level: 5,
    title: "Iniciante Focado",
    pointsRequired: 300,
    icon: "target",
    color: "#7E57C2", // Roxo
    description: "Começando a entender os benefícios da constância.",
  },
  {
    level: 6,
    title: "Atleta em Formação",
    pointsRequired: 400,
    icon: "arm-flex-outline",
    color: "#EC407A", // Rosa
    description: "Os primeiros resultados já são visíveis no espelho.",
  },
  {
    level: 7,
    title: "Entusiasta do Fitness",
    pointsRequired: 550,
    icon: "heart-pulse",
    color: "#FFA726", // Laranja
    description: "Treinar virou parte importante da sua rotina.",
  },
  {
    level: 8,
    title: "Corpo Atlético",
    pointsRequired: 700,
    icon: "human-handsup",
    color: "#FFCA28", // Amarelo
    description: "Sua forma física já chama atenção positiva.",
  },
  {
    level: 9,
    title: "Dedicado ao Treino",
    pointsRequired: 850,
    icon: "calendar-check",
    color: "#8D6E63", // Marrom
    description: "Raramente falta um dia de treino na agenda.",
  },
  {
    level: 10,
    title: "Expert em Treino",
    pointsRequired: 1000,
    icon: "palette-outline",
    color: "#26A69A", // Verde água
    description: "Domina técnicas avançadas e ajusta seu treino com precisão.",
  },
  {
    level: 11,
    title: "Atleta Disciplinado",
    pointsRequired: 1500,
    icon: "shield-check",
    color: "#AB47BC", // Roxo médio
    description: "Equilíbrio perfeito entre treino, nutrição e descanso.",
  },
  {
    level: 12,
    title: "Físico Destacado",
    pointsRequired: 2000,
    icon: "star-circle",
    color: "#42A5F5", // Azul claro
    description: "Conquistou um corpo que é referência na academia.",
  },
  {
    level: 13,
    title: "Monstrão",
    pointsRequired: 2500,
    icon: "arm-flex",
    color: "#F44336", // Vermelho
    description: "Seu shape já impressiona todo mundo.",
  },
  {
    level: 14,
    title: "Personal Trainer",
    pointsRequired: 3000,
    icon: "clipboard-text-outline",
    color: "#78909C", // Azul acinzentado
    description: "Conhece todos os exercícios e suas variações.",
  },
  {
    level: 15,
    title: "Mr. Olimpia",
    pointsRequired: 4000,
    icon: "medal",
    color: "#FFC107", // Amarelo ouro
    description: "Nível de dedicação profissional.",
  },
  {
    level: 16,
    title: "Mutante",
    pointsRequired: 5000,
    icon: "dna",
    color: "#4CAF50", // Verde
    description: "Genética e disciplina formando um shape perfeito.",
  },
  {
    level: 17,
    title: "Máquina",
    pointsRequired: 6500,
    icon: "robot",
    color: "#607D8B", // Azul acinzentado
    description: "Não conhece limites, só conhece superação.",
  },
  {
    level: 18,
    title: "Lenda Viva",
    pointsRequired: 8000,
    icon: "star-face",
    color: "#EF6C00", // Laranja escuro
    description: "Tornou-se referência para todos na academia.",
  },
  {
    level: 19,
    title: "Semideus",
    pointsRequired: 10000,
    icon: "shield-sun",
    color: "#F57F17", // Âmbar escuro
    description: "Poucos mortais chegam a este nível.",
  },
  {
    level: 20,
    title: "Deus Grego",
    pointsRequired: 12000,
    icon: "lightning-bolt-circle",
    color: "#FFD700", // Dourado
    description: "Atingiu a perfeição física digna do Olimpo!",
  },
];

/**
 * Obtém o nível atual com base na quantidade de FitPoints
 * @param points Total de FitPoints do usuário
 * @returns Objeto FitLevel contendo as informações do nível atual
 */
export function getCurrentFitLevel(points: number): FitLevel {
  // Começar do nível mais alto e verificar para baixo
  for (let i = FIT_LEVELS.length - 1; i >= 0; i--) {
    if (points >= FIT_LEVELS[i].pointsRequired) {
      return FIT_LEVELS[i];
    }
  }

  // Fallback para o primeiro nível (caso pontos seja negativo, o que não deveria acontecer)
  return FIT_LEVELS[0];
}

/**
 * Calcula o progresso para o próximo nível
 * @param points Total de FitPoints do usuário
 * @returns Objeto contendo o próximo nível e a porcentagem de progresso
 */
export function getNextLevelProgress(points: number): {
  current: FitLevel;
  next: FitLevel | null;
  percentage: number;
  pointsToNext: number;
} {
  const currentLevel = getCurrentFitLevel(points);
  const currentLevelIndex = FIT_LEVELS.findIndex(
    (level) => level.level === currentLevel.level
  );

  // Se está no nível máximo, não há próximo nível
  if (currentLevelIndex === FIT_LEVELS.length - 1) {
    return {
      current: currentLevel,
      next: null,
      percentage: 100,
      pointsToNext: 0,
    };
  }

  const nextLevel = FIT_LEVELS[currentLevelIndex + 1];
  const pointsForCurrentLevel = points - currentLevel.pointsRequired;
  const pointsNeededForNextLevel =
    nextLevel.pointsRequired - currentLevel.pointsRequired;
  const percentage = Math.min(
    100,
    Math.round((pointsForCurrentLevel / pointsNeededForNextLevel) * 100)
  );
  const pointsToNext = nextLevel.pointsRequired - points;

  return {
    current: currentLevel,
    next: nextLevel,
    percentage,
    pointsToNext,
  };
}
