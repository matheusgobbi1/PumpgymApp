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
    title: "Iniciante",
    pointsRequired: 0,
    icon: "baby-bottle",
    color: "#9E9E9E", // Cinza
    description: "Acabou de entrar na academia e ainda não tem experiência.",
  },
  {
    level: 2,
    title: "Frango",
    pointsRequired: 150,
    icon: "food-drumstick-outline",
    color: "#B0BEC5", // Cinza Azulado Claro
    description: "Está aprendendo os movimentos básicos.",
  },
  {
    level: 3,
    title: "Frango Motivado",
    pointsRequired: 300,
    icon: "turkey",
    color: "#90CAF9", // Azul Claro
    description: "Está criando o hábito de treinar regularmente.",
  },
  {
    level: 4,
    title: "Frango Dedicado",
    pointsRequired: 600,
    icon: "food-turkey",
    color: "#64B5F6", // Azul
    description: "Está descobrindo sua rotina ideal de treinos.",
  },
  {
    level: 5,
    title: "Iniciante Avançado",
    pointsRequired: 1000,
    icon: "chevron-triple-up",
    color: "#42A5F5", // Azul Intenso
    description: "Começando a entender os benefícios da constância.",
  },
  {
    level: 6,
    title: "Rato de Academia",
    pointsRequired: 1500,
    icon: "rodent",
    color: "#4DD0E1", // Ciano Claro
    description: "Os primeiros resultados já são visíveis no espelho.",
  },
  {
    level: 7,
    title: "Gymbro",
    pointsRequired: 2000,
    icon: "weight-lifter",
    color: "#4DB6AC", // Turquesa
    description: "Treinar virou parte importante da sua rotina.",
  },
  {
    level: 8,
    title: "Atleta",
    pointsRequired: 2000,
    icon: "run-fast",
    color: "#81C784", // Verde Claro
    description: "Sua forma física já chama atenção positiva.",
  },
  {
    level: 9,
    title: "Envenenado",
    pointsRequired: 2700,
    icon: "bottle-tonic-skull",
    color: "#AED581", // Verde Lima Claro
    description: "Raramente falta um dia de treino na agenda.",
  },
  {
    level: 10,
    title: "Personal Trainer",
    pointsRequired: 3500,
    icon: "clipboard-text-outline",
    color: "#FFF176", // Amarelo Claro
    description: "Domina técnicas avançadas e ajusta seu treino com precisão.",
  },
  {
    level: 11,
    title: "Monstro",
    pointsRequired: 4500,
    icon: "circular-saw",
    color: "#FFD54F", // Âmbar Claro
    description: "Equilíbrio perfeito entre treino, nutrição e descanso.",
  },
  {
    level: 12,
    title: "Mutante",
    pointsRequired: 5700,
    icon: "dna",
    color: "#FFB74D", // Laranja Claro
    description: "Conquistou um corpo que é referência na academia.",
  },
  {
    level: 13,
    title: "Máquina",
    pointsRequired: 7000,
    icon: "robot",
    color: "#FF8A65", // Laranja Avermelhado Claro
    description: "Seu shape já impressiona todo mundo.",
  },
  {
    level: 14,
    title: "Lenda Viva",
    pointsRequired: 8500,
    icon: "star-face",
    color: "#F06292", // Rosa Claro
    description: "Conhece todos os exercícios e suas variações.",
  },
  {
    level: 15,
    title: "Tanque",
    pointsRequired: 10000,
    icon: "tank",
    color: "#BA68C8", // Roxo Claro
    description: "Genética e disciplina formando um shape perfeito.",
  },
  {
    level: 16,
    title: "Bodybuilder",
    pointsRequired: 12000,
    icon: "human-handsup",
    color: "#9575CD", // Roxo Intenso Claro
    description: "Não conhece limites, só conhece superação.",
  },
  {
    level: 17,
    title: "Semideus",
    pointsRequired: 14000,
    icon: "shield-sun",
    color: "#7986CB", // Índigo Claro
    description: "Tornou-se referência para todos na academia.",
  },
  {
    level: 18,
    title: "Mr. Olimpia",
    pointsRequired: 16000,
    icon: "trophy",
    color: "#E53935", // Vermelho
    description: "Nível de dedicação profissional.",
  },
  {
    level: 19,
    title: "Leviatã",
    pointsRequired: 18000,
    icon: "shark",
    color: "#C2185B", // Magenta Escuro
    description: "Poucos mortais chegam a este nível.",
  },
  {
    level: 20,
    title: "Deus Grego",
    pointsRequired: 20000,
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
