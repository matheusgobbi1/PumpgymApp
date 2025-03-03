// Banco de dados de exercícios básicos para teste
export interface ExerciseData {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  difficulty: 'iniciante' | 'intermediário' | 'avançado';
  category: 'força' | 'cardio' | 'flexibilidade' | 'equilíbrio';
}

// Categorias de músculos
export const muscleGroups = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Glúteos',
  'Antebraço',
  'Panturrilha',
  'Lombar',
  'Trapézio',
  'Cardio',
  'Corpo inteiro'
];

// Categorias de equipamentos
export const equipmentTypes = [
  'Barra',
  'Halteres',
  'Máquina',
  'Cabo',
  'Kettlebell',
  'Peso corporal',
  'Elástico',
  'Bola',
  'TRX',
  'Esteira',
  'Bicicleta',
  'Elíptico',
  'Sem equipamento'
];

// Banco de dados de exercícios
export const exerciseDatabase: ExerciseData[] = [
  // Peito
  {
    id: 'ex001',
    name: 'Supino Reto',
    muscle: 'Peito',
    equipment: 'Barra',
    description: 'Deite-se em um banco reto, segure a barra com as mãos um pouco mais afastadas que a largura dos ombros, abaixe a barra até o peito e empurre de volta para cima.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex002',
    name: 'Supino Inclinado',
    muscle: 'Peito',
    equipment: 'Barra',
    description: 'Deite-se em um banco inclinado, segure a barra com as mãos um pouco mais afastadas que a largura dos ombros, abaixe a barra até o peito e empurre de volta para cima.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex003',
    name: 'Crucifixo',
    muscle: 'Peito',
    equipment: 'Halteres',
    description: 'Deite-se em um banco reto, segure os halteres acima do peito com os braços estendidos, abaixe os braços para os lados até sentir um alongamento no peito, e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex004',
    name: 'Flexão de Braço',
    muscle: 'Peito',
    equipment: 'Peso corporal',
    description: 'Apoie-se no chão com as mãos um pouco mais afastadas que a largura dos ombros, mantenha o corpo reto, abaixe o corpo até quase tocar o chão e empurre de volta para cima.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex005',
    name: 'Supino Declinado',
    muscle: 'Peito',
    equipment: 'Barra',
    description: 'Deite-se em um banco declinado, segure a barra com as mãos um pouco mais afastadas que a largura dos ombros, abaixe a barra até o peito e empurre de volta para cima.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex006',
    name: 'Crucifixo Inclinado',
    muscle: 'Peito',
    equipment: 'Halteres',
    description: 'Deite-se em um banco inclinado, segure os halteres acima do peito com os braços estendidos, abaixe os braços para os lados até sentir um alongamento no peito, e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex007',
    name: 'Flexão de Braço Diamante',
    muscle: 'Peito',
    equipment: 'Peso corporal',
    description: 'Apoie-se no chão com as mãos próximas uma da outra formando um diamante, mantenha o corpo reto, abaixe o corpo até quase tocar o chão e empurre de volta para cima.',
    difficulty: 'avançado',
    category: 'força',
  },
  
  // Costas
  {
    id: 'ex008',
    name: 'Puxada Frontal',
    muscle: 'Costas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina de puxada, segure a barra com as mãos afastadas, puxe a barra para baixo até a altura do queixo e retorne lentamente à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex009',
    name: 'Remada Curvada',
    muscle: 'Costas',
    equipment: 'Barra',
    description: 'Segure a barra com as mãos afastadas, curve o tronco para frente mantendo as costas retas, puxe a barra até o abdômen e retorne lentamente à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex010',
    name: 'Remada Unilateral',
    muscle: 'Costas',
    equipment: 'Halteres',
    description: 'Apoie um joelho e uma mão em um banco, mantenha as costas paralelas ao chão, segure o halter com a outra mão, puxe o halter até o quadril e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex011',
    name: 'Puxada Atrás da Nuca',
    muscle: 'Costas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina de puxada, segure a barra atrás da nuca, puxe a barra para baixo até a altura do pescoço e retorne lentamente à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex012',
    name: 'Remada na Máquina',
    muscle: 'Costas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina de remada, segure as alças, puxe em direção ao abdômen mantendo as costas retas e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex013',
    name: 'Puxada com Triângulo',
    muscle: 'Costas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina de puxada, segure o triângulo com as mãos próximas, puxe para baixo até o peito e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex014',
    name: 'Remada Baixa',
    muscle: 'Costas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina de remada baixa, segure a barra com as mãos afastadas, puxe em direção ao abdômen mantendo as costas retas e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  
  // Pernas
  {
    id: 'ex015',
    name: 'Agachamento',
    muscle: 'Pernas',
    equipment: 'Barra',
    description: 'Posicione a barra nos ombros, pés afastados na largura dos ombros, flexione os joelhos e quadris como se fosse sentar em uma cadeira, desça até as coxas ficarem paralelas ao chão e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex016',
    name: 'Leg Press',
    muscle: 'Pernas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina com os pés na plataforma, empurre a plataforma afastando-a do corpo até estender as pernas (sem travar os joelhos) e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex017',
    name: 'Cadeira Extensora',
    muscle: 'Pernas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina com os joelhos dobrados, estenda as pernas até ficarem retas e retorne lentamente à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex018',
    name: 'Cadeira Flexora',
    muscle: 'Pernas',
    equipment: 'Máquina',
    description: 'Deite-se na máquina com os calcanhares apoiados no rolo, flexione os joelhos trazendo o rolo em direção aos glúteos e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex019',
    name: 'Agachamento Búlgaro',
    muscle: 'Pernas',
    equipment: 'Halteres',
    description: 'Posicione um pé atrás em um banco, segure halteres nas mãos, faça o agachamento com a perna da frente e retorne à posição inicial.',
    difficulty: 'avançado',
    category: 'força',
  },
  {
    id: 'ex020',
    name: 'Cadeira Adutora',
    muscle: 'Pernas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina com as pernas afastadas, aproxime as pernas uma da outra contraindo a parte interna das coxas e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex021',
    name: 'Cadeira Abdutora',
    muscle: 'Pernas',
    equipment: 'Máquina',
    description: 'Sente-se na máquina com as pernas juntas, afaste as pernas contraindo a parte externa das coxas e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  
  // Ombros
  {
    id: 'ex022',
    name: 'Desenvolvimento',
    muscle: 'Ombros',
    equipment: 'Barra',
    description: 'Segure a barra na altura dos ombros com as mãos afastadas, empurre a barra para cima até estender os braços e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex023',
    name: 'Elevação Lateral',
    muscle: 'Ombros',
    equipment: 'Halteres',
    description: 'Em pé, segure os halteres ao lado do corpo, eleve os braços lateralmente até a altura dos ombros e retorne lentamente à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex024',
    name: 'Elevação Frontal',
    muscle: 'Ombros',
    equipment: 'Halteres',
    description: 'Em pé, segure os halteres na frente do corpo, eleve os braços para frente até a altura dos ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex025',
    name: 'Desenvolvimento Arnold',
    muscle: 'Ombros',
    equipment: 'Halteres',
    description: 'Sente-se em um banco, segure os halteres na frente dos ombros com as palmas voltadas para você, gire os braços enquanto empurra para cima e retorne à posição inicial.',
    difficulty: 'avançado',
    category: 'força',
  },
  {
    id: 'ex026',
    name: 'Elevação Lateral na Máquina',
    muscle: 'Ombros',
    equipment: 'Máquina',
    description: 'Sente-se na máquina, segure as alças, eleve os braços lateralmente até a altura dos ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex027',
    name: 'Remada Alta',
    muscle: 'Ombros',
    equipment: 'Barra',
    description: 'Em pé, segure a barra com as mãos próximas, eleve os cotovelos até a altura dos ombros e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex028',
    name: 'Rotação Externa',
    muscle: 'Ombros',
    equipment: 'Cabo',
    description: 'Em pé ao lado do aparelho, segure a alça com o braço próximo ao aparelho, gire o braço para fora mantendo o cotovelo junto ao corpo e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  
  // Bíceps
  {
    id: 'ex029',
    name: 'Rosca Direta',
    muscle: 'Bíceps',
    equipment: 'Barra',
    description: 'Em pé, segure a barra com as mãos na largura dos ombros, flexione os cotovelos trazendo a barra até os ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex030',
    name: 'Rosca Alternada',
    muscle: 'Bíceps',
    equipment: 'Halteres',
    description: 'Em pé, segure os halteres ao lado do corpo, flexione um braço por vez trazendo o halter até o ombro e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex031',
    name: 'Rosca Martelo',
    muscle: 'Bíceps',
    equipment: 'Halteres',
    description: 'Em pé, segure os halteres com as palmas voltadas uma para a outra, flexione os cotovelos trazendo os halteres até os ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex032',
    name: 'Rosca na Máquina',
    muscle: 'Bíceps',
    equipment: 'Máquina',
    description: 'Sente-se na máquina, segure as alças, flexione os cotovelos trazendo as alças até os ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex033',
    name: 'Rosca Scott',
    muscle: 'Bíceps',
    equipment: 'Barra',
    description: 'Sente-se no banco Scott, apoie os braços no suporte, segure a barra com as mãos na largura dos ombros, flexione os cotovelos trazendo a barra até os ombros e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex034',
    name: 'Rosca Concentrada',
    muscle: 'Bíceps',
    equipment: 'Halteres',
    description: 'Sente-se em um banco, apoie o cotovelo na parte interna da coxa, segure o halter, flexione o cotovelo trazendo o halter até o ombro e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex035',
    name: 'Rosca com Corda',
    muscle: 'Bíceps',
    equipment: 'Cabo',
    description: 'Em pé em frente ao aparelho, segure a corda com as mãos, flexione os cotovelos trazendo a corda até os ombros e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  
  // Tríceps
  {
    id: 'ex036',
    name: 'Tríceps Corda',
    muscle: 'Tríceps',
    equipment: 'Cabo',
    description: 'Em pé em frente ao aparelho, segure a corda com as mãos, mantenha os cotovelos junto ao corpo, estenda os braços para baixo e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex037',
    name: 'Tríceps Testa',
    muscle: 'Tríceps',
    equipment: 'Barra',
    description: 'Deite-se em um banco reto, segure a barra com as mãos próximas, mantenha os braços perpendiculares ao chão, flexione os cotovelos trazendo a barra até a testa e estenda os braços.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex038',
    name: 'Tríceps Francês',
    muscle: 'Tríceps',
    equipment: 'Halteres',
    description: 'Deite-se em um banco reto, segure um halter com as duas mãos atrás da cabeça, estenda os braços para cima e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex039',
    name: 'Tríceps na Máquina',
    muscle: 'Tríceps',
    equipment: 'Máquina',
    description: 'Sente-se na máquina, segure as alças, estenda os braços para baixo e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex040',
    name: 'Tríceps Banco',
    muscle: 'Tríceps',
    equipment: 'Peso corporal',
    description: 'Apoie as mãos em um banco atrás do corpo, mantenha os pés no chão, flexione os cotovelos abaixando o corpo e empurre de volta para cima.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex041',
    name: 'Tríceps Unilateral',
    muscle: 'Tríceps',
    equipment: 'Cabo',
    description: 'Em pé ao lado do aparelho, segure a alça com uma mão, mantenha o cotovelo junto ao corpo, estenda o braço para baixo e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex042',
    name: 'Tríceps Extensão',
    muscle: 'Tríceps',
    equipment: 'Halteres',
    description: 'Em pé, segure um halter com as duas mãos atrás da cabeça, estenda os braços para cima e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  
  // Abdômen
  {
    id: 'ex043',
    name: 'Abdominal Reto',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Deite-se de costas com os joelhos dobrados, coloque as mãos atrás da cabeça, eleve o tronco em direção aos joelhos e retorne à posição inicial.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex044',
    name: 'Prancha',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Apoie-se nos antebraços e nas pontas dos pés, mantenha o corpo reto como uma tábua, contraia o abdômen e mantenha a posição pelo tempo determinado.',
    difficulty: 'iniciante',
    category: 'força',
  },
  {
    id: 'ex045',
    name: 'Abdominal Oblíquo',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Deite-se de costas com os joelhos dobrados, coloque as mãos atrás da cabeça, eleve o tronco girando em direção ao joelho oposto e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex046',
    name: 'Abdominal Infra',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Deite-se de costas com as pernas estendidas, eleve as pernas até formar um ângulo de 90 graus com o tronco e retorne à posição inicial.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex047',
    name: 'Abdominal Bicicleta',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Deite-se de costas com as pernas elevadas, mova as pernas como se estivesse pedalando uma bicicleta enquanto toca o cotovelo oposto no joelho.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex048',
    name: 'Prancha Lateral',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Apoie-se em um antebraço e na lateral do pé, mantenha o corpo reto como uma tábua, contraia o abdômen e mantenha a posição pelo tempo determinado.',
    difficulty: 'intermediário',
    category: 'força',
  },
  {
    id: 'ex049',
    name: 'Abdominal com Rotação',
    muscle: 'Abdômen',
    equipment: 'Peso corporal',
    description: 'Deite-se de costas com os joelhos dobrados, eleve o tronco e gire o corpo para os lados alternadamente, retornando à posição inicial.',
    difficulty: 'avançado',
    category: 'força',
  },
  
  // Cardio
  {
    id: 'ex050',
    name: 'Corrida',
    muscle: 'Cardio',
    equipment: 'Esteira',
    description: 'Corra na esteira na velocidade e inclinação desejadas pelo tempo determinado.',
    difficulty: 'intermediário',
    category: 'cardio',
  },
  {
    id: 'ex051',
    name: 'Pular Corda',
    muscle: 'Cardio',
    equipment: 'Corda',
    description: 'Segure as extremidades da corda, gire-a e pule quando ela passar sob seus pés.',
    difficulty: 'intermediário',
    category: 'cardio',
  },
  {
    id: 'ex052',
    name: 'Burpee',
    muscle: 'Cardio',
    equipment: 'Peso corporal',
    description: 'Comece em pé, agache-se e coloque as mãos no chão, jogue os pés para trás ficando na posição de flexão, faça uma flexão, traga os pés de volta para perto das mãos e salte estendendo os braços acima da cabeça.',
    difficulty: 'avançado',
    category: 'cardio',
  },
  {
    id: 'ex053',
    name: 'Agachamento com Salto',
    muscle: 'Cardio',
    equipment: 'Peso corporal',
    description: 'Comece em pé, faça um agachamento e, ao subir, impulsione-se para cima em um salto, aterrisse suavemente e repita o movimento.',
    difficulty: 'intermediário',
    category: 'cardio',
  },
  {
    id: 'ex054',
    name: 'Bicicleta Ergométrica',
    muscle: 'Cardio',
    equipment: 'Bicicleta',
    description: 'Pedale na bicicleta ergométrica na intensidade desejada pelo tempo determinado.',
    difficulty: 'iniciante',
    category: 'cardio',
  },
  {
    id: 'ex055',
    name: 'Elíptico',
    muscle: 'Cardio',
    equipment: 'Elíptico',
    description: 'Use o aparelho elíptico movendo os braços e pernas de forma coordenada na intensidade desejada.',
    difficulty: 'iniciante',
    category: 'cardio',
  },
  {
    id: 'ex056',
    name: 'Mountain Climber',
    muscle: 'Cardio',
    equipment: 'Peso corporal',
    description: 'Comece na posição de flexão, alterne movendo os joelhos em direção ao peito como se estivesse escalando uma montanha.',
    difficulty: 'intermediário',
    category: 'cardio',
  }
];

// Função para pesquisar exercícios
export const searchExercises = (query: string): ExerciseData[] => {
  if (!query.trim()) return [];
  
  const lowerCaseQuery = query.toLowerCase().trim();
  
  return exerciseDatabase.filter(exercise => 
    exercise.name.toLowerCase().includes(lowerCaseQuery) ||
    exercise.muscle.toLowerCase().includes(lowerCaseQuery) ||
    exercise.equipment.toLowerCase().includes(lowerCaseQuery) ||
    exercise.description.toLowerCase().includes(lowerCaseQuery)
  );
};

// Função para obter exercícios por grupo muscular
export const getExercisesByMuscle = (muscle: string): ExerciseData[] => {
  return exerciseDatabase.filter(exercise => exercise.muscle === muscle);
};

// Função para obter exercícios por equipamento
export const getExercisesByEquipment = (equipment: string): ExerciseData[] => {
  return exerciseDatabase.filter(exercise => exercise.equipment === equipment);
};

// Função para obter exercício por ID
export const getExerciseById = (id: string): ExerciseData | undefined => {
  return exerciseDatabase.find(exercise => exercise.id === id);
}; 