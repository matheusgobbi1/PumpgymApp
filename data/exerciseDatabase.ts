// Banco de dados de exercícios básicos para teste
export interface ExerciseData {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  imageUrl?: string;
  videoUrl?: string;
  category: "força" | "cardio" | "flexibilidade" | "equilíbrio";
}

// Categorias de músculos
export const muscleGroups = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Glúteos",
  "Antebraço",
  "Panturrilha",
  "Lombar",
  "Trapézio",
  "Cardio",
  "Corpo inteiro",
];

// Categorias de equipamentos
export const equipmentTypes = [
  "Barra",
  "Halteres",
  "Máquina",
  "Cabo",
  "Kettlebell",
  "Elástico",
  "Bola",
  "TRX",
  "Esteira",
  "Bicicleta",
  "Elíptico",
  "Sem equipamento",
];

// Banco de dados de exercícios
export const exerciseDatabase: ExerciseData[] = [
  // Peito
  {
    id: "ex001",
    name: "Supino Reto",
    muscle: "Peito",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex002",
    name: "Supino Inclinado",
    muscle: "Peito",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex003",
    name: "Crucifixo",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex005",
    name: "Supino Declinado",
    muscle: "Peito",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex006",
    name: "Crucifixo Inclinado",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex101",
    name: "Crossover",
    muscle: "Peito",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex103",
    name: "Peck Deck",
    muscle: "Peito",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex200",
    name: "Supino Reto com Halteres",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex201",
    name: "Supino Inclinado com Halteres",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex202",
    name: "Supino Declinado com Halteres",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex203",
    name: "Pullover com Cabo",
    muscle: "Peito",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex204",
    name: "Crossover Baixo",
    muscle: "Peito",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex205",
    name: "Crossover Alto",
    muscle: "Peito",
    equipment: "Cabo",
    category: "força",
  },

  // Costas
  {
    id: "ex008",
    name: "Puxada Frontal",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex009",
    name: "Remada Curvada",
    muscle: "Costas",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex010",
    name: "Remada Unilateral",
    muscle: "Costas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex011",
    name: "Puxada Atrás da Nuca",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex012",
    name: "Remada na Máquina",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex013",
    name: "Puxada com Triângulo",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex014",
    name: "Remada Baixa",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex104",
    name: "Barra Fixa",
    muscle: "Costas",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex106",
    name: "Pulldown com Pegada Fechada",
    muscle: "Costas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex206",
    name: "Remada com Cabo",
    muscle: "Costas",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex207",
    name: "Remada Sentada com Cabo",
    muscle: "Costas",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex208",
    name: "Remada Curvada com Halteres",
    muscle: "Costas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex209",
    name: "Pulldown com Corda",
    muscle: "Costas",
    equipment: "Cabo",
    category: "força",
  },

  // Pernas
  {
    id: "ex015",
    name: "Agachamento",
    muscle: "Pernas",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex016",
    name: "Leg Press",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex017",
    name: "Cadeira Extensora",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex018",
    name: "Cadeira Flexora",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex019",
    name: "Agachamento Búlgaro",
    muscle: "Pernas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex020",
    name: "Cadeira Adutora",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex021",
    name: "Cadeira Abdutora",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex107",
    name: "Leg Curl",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex108",
    name: "Agachamento Hack",
    muscle: "Pernas",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex109",
    name: "Passada",
    muscle: "Pernas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex210",
    name: "Agachamento com Halteres",
    muscle: "Pernas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex211",
    name: "Agachamento Sumô com Halteres",
    muscle: "Pernas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex212",
    name: "Extensão de Quadril com Cabo",
    muscle: "Glúteos",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex213",
    name: "Abdução de Quadril com Cabo",
    muscle: "Glúteos",
    equipment: "Cabo",
    category: "força",
  },

  // Ombros
  {
    id: "ex022",
    name: "Desenvolvimento",
    muscle: "Ombros",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex023",
    name: "Elevação Lateral",
    muscle: "Ombros",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex024",
    name: "Elevação Frontal",
    muscle: "Ombros",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex025",
    name: "Desenvolvimento Arnold",
    muscle: "Ombros",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex026",
    name: "Elevação Lateral na Máquina",
    muscle: "Ombros",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex027",
    name: "Remada Alta",
    muscle: "Ombros",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex028",
    name: "Rotação Externa",
    muscle: "Ombros",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex110",
    name: "Desenvolvimento com Halteres",
    muscle: "Ombros",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex111",
    name: "Elevação Posterior",
    muscle: "Ombros",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex112",
    name: "Press Militar",
    muscle: "Ombros",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex214",
    name: "Elevação Lateral com Cabo",
    muscle: "Ombros",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex215",
    name: "Elevação Frontal com Cabo",
    muscle: "Ombros",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex216",
    name: "Elevação Posterior com Cabo",
    muscle: "Ombros",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex217",
    name: "Encolhimento com Halteres",
    muscle: "Trapézio",
    equipment: "Halteres",
    category: "força",
  },

  // Bíceps
  {
    id: "ex029",
    name: "Rosca Direta",
    muscle: "Bíceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex030",
    name: "Rosca Alternada",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex031",
    name: "Rosca Martelo",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex032",
    name: "Rosca na Máquina",
    muscle: "Bíceps",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex033",
    name: "Rosca Scott",
    muscle: "Bíceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex034",
    name: "Rosca Concentrada",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex035",
    name: "Rosca com Corda",
    muscle: "Bíceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex113",
    name: "Rosca Concentrada",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex114",
    name: "Rosca Inclinada",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex115",
    name: "Rosca com Pegada Invertida",
    muscle: "Bíceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex218",
    name: "Rosca Direta com Cabo",
    muscle: "Bíceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex219",
    name: "Rosca Scott com Halteres",
    muscle: "Bíceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex220",
    name: "Rosca 21",
    muscle: "Bíceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex221",
    name: "Rosca Alternada com Cabo",
    muscle: "Bíceps",
    equipment: "Cabo",
    category: "força",
  },

  // Tríceps
  {
    id: "ex036",
    name: "Tríceps Corda",
    muscle: "Tríceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex037",
    name: "Tríceps Testa",
    muscle: "Tríceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex038",
    name: "Tríceps Francês",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex039",
    name: "Tríceps na Máquina",
    muscle: "Tríceps",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex041",
    name: "Tríceps Unilateral",
    muscle: "Tríceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex042",
    name: "Tríceps Extensão",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex116",
    name: "Tríceps Testa com Halteres",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex118",
    name: "Tríceps Pulldown",
    muscle: "Tríceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex222",
    name: "Tríceps Kickback com Halteres",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex223",
    name: "Tríceps Pushdown com Barra V",
    muscle: "Tríceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex224",
    name: "Tríceps Pushdown com Barra Reta",
    muscle: "Tríceps",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex225",
    name: "Extensão de Tríceps Deitado com Halteres",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },

  // Abdômen
  {
    id: "ex120",
    name: "Abdominal na Máquina",
    muscle: "Abdômen",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex121",
    name: "Abdominal com Roda",
    muscle: "Abdômen",
    equipment: "Roda",
    category: "força",
  },
  {
    id: "ex226",
    name: "Abdominal com Cabo",
    muscle: "Abdômen",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex227",
    name: "Oblíquos com Cabo",
    muscle: "Abdômen",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex228",
    name: "Abdominal com Halteres",
    muscle: "Abdômen",
    equipment: "Halteres",
    category: "força",
  },

  // Cardio
  {
    id: "ex050",
    name: "Corrida",
    muscle: "Cardio",
    equipment: "Esteira",
    category: "cardio",
  },
  {
    id: "ex054",
    name: "Bicicleta Ergométrica",
    muscle: "Cardio",
    equipment: "Bicicleta",
    category: "cardio",
  },
  {
    id: "ex055",
    name: "Elíptico",
    muscle: "Cardio",
    equipment: "Elíptico",
    category: "cardio",
  },
  {
    id: "ex075",
    name: "Corrida Intervalada",
    muscle: "Cardio",
    equipment: "Esteira",
    category: "cardio",
  },

  // Glúteos
  {
    id: "ex058",
    name: "Agachamento Sumô",
    muscle: "Glúteos",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex229",
    name: "Elevação Pélvica com Halteres",
    muscle: "Glúteos",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex230",
    name: "Glúteos na Máquina",
    muscle: "Glúteos",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex231",
    name: "Chute para trás com Cabo",
    muscle: "Glúteos",
    equipment: "Cabo",
    category: "força",
  },

  // Panturrilha
  {
    id: "ex060",
    name: "Elevação de Panturrilha Sentado",
    muscle: "Panturrilha",
    equipment: "Máquina",
    category: "força",
  },
  {
    id: "ex087",
    name: "Calf Raise com Halteres",
    muscle: "Panturrilha",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex088",
    name: "Calf Raise na Máquina",
    muscle: "Panturrilha",
    equipment: "Máquina",
    category: "força",
  },

  // Antebraço
  {
    id: "ex061",
    name: "Rosca de Punho",
    muscle: "Antebraço",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex062",
    name: "Rosca Inversa",
    muscle: "Antebraço",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex232",
    name: "Rosca de Punho com Cabo",
    muscle: "Antebraço",
    equipment: "Cabo",
    category: "força",
  },
  {
    id: "ex233",
    name: "Rosca Inversa com Cabo",
    muscle: "Antebraço",
    equipment: "Cabo",
    category: "força",
  },

  // Adicionando novos exercícios
  {
    id: "ex063",
    name: "Levantamento Terra",
    muscle: "Lombar",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex064",
    name: "Stiff",
    muscle: "Lombar",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex065",
    name: "Pullover",
    muscle: "Peito",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex066",
    name: "Crucifixo Invertido",
    muscle: "Costas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex067",
    name: "Remada Cavalinho",
    muscle: "Costas",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex068",
    name: "Desenvolvimento Militar",
    muscle: "Ombros",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex069",
    name: "Elevação Frontal com Barra",
    muscle: "Ombros",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex070",
    name: "Rosca Concentrada com Barra",
    muscle: "Bíceps",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex071",
    name: "Tríceps Coice",
    muscle: "Tríceps",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex079",
    name: "Kettlebell Swing",
    muscle: "Corpo inteiro",
    equipment: "Kettlebell",
    category: "força",
  },
  {
    id: "ex080",
    name: "Turkish Get-Up",
    muscle: "Corpo inteiro",
    equipment: "Kettlebell",
    category: "força",
  },
  {
    id: "ex081",
    name: "Snatch",
    muscle: "Corpo inteiro",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex082",
    name: "Clean and Jerk",
    muscle: "Corpo inteiro",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex083",
    name: "Lunge com Barra",
    muscle: "Pernas",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex084",
    name: "Lunge com Halteres",
    muscle: "Pernas",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex085",
    name: "Step-Up",
    muscle: "Pernas",
    equipment: "Caixa",
    category: "força",
  },
  {
    id: "ex089",
    name: "Farmers Walk",
    muscle: "Corpo inteiro",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex094",
    name: "Hanging Leg Raise",
    muscle: "Abdômen",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex097",
    name: "Windshield Wipers",
    muscle: "Abdômen",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex098",
    name: "L-Sit",
    muscle: "Abdômen",
    equipment: "Paralelas",
    category: "força",
  },
  {
    id: "ex100",
    name: "Muscle-Up",
    muscle: "Corpo inteiro",
    equipment: "Barra",
    category: "força",
  },
  {
    id: "ex234",
    name: "Stiff com Halteres",
    muscle: "Lombar",
    equipment: "Halteres",
    category: "força",
  },
  {
    id: "ex235",
    name: "Levantamento Terra Sumô",
    muscle: "Lombar",
    equipment: "Barra",
    category: "força",
  },
];

// Função para pesquisar exercícios
export const searchExercises = (query: string): ExerciseData[] => {
  if (!query.trim()) return [];

  const lowerCaseQuery = query.toLowerCase().trim();

  return exerciseDatabase.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(lowerCaseQuery) ||
      exercise.muscle.toLowerCase().includes(lowerCaseQuery) ||
      exercise.equipment.toLowerCase().includes(lowerCaseQuery)
  );
};

// Função para obter exercícios por grupo muscular
export const getExercisesByMuscle = (muscle: string): ExerciseData[] => {
  return exerciseDatabase.filter((exercise) => exercise.muscle === muscle);
};

// Função para obter exercícios por equipamento
export const getExercisesByEquipment = (equipment: string): ExerciseData[] => {
  return exerciseDatabase.filter(
    (exercise) => exercise.equipment === equipment
  );
};

// Função para obter exercício por ID
export const getExerciseById = (id: string): ExerciseData | undefined => {
  return exerciseDatabase.find((exercise) => exercise.id === id);
};
