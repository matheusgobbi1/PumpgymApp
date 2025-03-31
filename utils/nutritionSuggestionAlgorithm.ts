import { v4 as uuidv4 } from 'uuid';
import { 
  FoodSuggestion, 
  foodDatabase, 
  findFoodById, 
  getFoodsByCategory,
  mealTypeConfigs 
} from '../data/nutritionSuggestionDatabase';

// Interfaces para o algoritmo de sugestão
export interface NutritionSuggestion {
  id: string;
  mealId: string;
  mealName: string;
  suggestedFoods: SuggestedFood[];
  macroTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  reasonForSuggestion: string;
}

export interface SuggestedFood {
  food: FoodSuggestion;
  calculatedPortion: number; // porção calculada para atingir os macros
  substitutes: FoodSuggestion[];
  calculatedUnits?: number; // número de unidades calculado (para alimentos que usam unidades)
}

interface UserNutritionGoals {
  calories: number;
  protein: number; // em gramas
  carbs: number; // em gramas
  fat: number; // em gramas
  meals: number; // quantidade de refeições por dia
}

// Configurações de tolerância para ajustes
const ADJUSTMENT_CONFIG = {
  TOLERANCE_PERCENTAGE: 0.01, // 1% de tolerância
  MAX_ITERATIONS: 4, // Aumentado de 3 para 4 iterações para ajuste global
  PROTEIN_SAFETY_MARGIN: 1.02, // Aumentado para 102% para garantir que atinja a meta de proteína
  CARBS_SAFETY_MARGIN: 0.99, // Mantido em 99%
  FAT_SAFETY_MARGIN: 0.95, // Reduzido para 95% para evitar excesso de gorduras
};

// Função principal para gerar sugestões de refeições
export function generateMealSuggestion(
  mealId: string,
  mealName: string,
  userNutritionGoals: UserNutritionGoals,
  globalAdjustmentFactor?: {
    proteinFactor?: number;
    carbsFactor?: number;
    fatFactor?: number;
    caloriesFactor?: number;
  }
): NutritionSuggestion {
  // Encontrar a configuração para o tipo de refeição
  const mealType = getMealTypeFromId(mealId);
  const mealConfig = mealTypeConfigs[mealType as keyof typeof mealTypeConfigs];
  
  if (!mealConfig) {
    throw new Error(`Configuração não encontrada para o tipo de refeição: ${mealType}`);
  }

  // Distribuição melhorada de proteínas entre as refeições
  const proteinDistribution = {
    breakfast: 0.25, // Aumentado para 25% (era valor padrão)
    lunch: 0.35,    // Mantido em 35% 
    dinner: 0.30,   // Mantido em 30%
    snack: 0.10     // Mantido em 10%
  };

  // Calcular macros alvos para esta refeição
  let targetMacros = {
    protein: userNutritionGoals.protein * (proteinDistribution[mealType as keyof typeof proteinDistribution] || mealConfig.baseMacroDistribution.protein),
    carbs: userNutritionGoals.carbs * mealConfig.baseMacroDistribution.carbs,
    fat: userNutritionGoals.fat * mealConfig.baseMacroDistribution.fat
  };

  // Aplicar fatores de ajuste global, se fornecidos
  if (globalAdjustmentFactor) {
    if (globalAdjustmentFactor.proteinFactor) {
      targetMacros.protein *= globalAdjustmentFactor.proteinFactor;
      
      // Ajuste extra para proteínas em determinadas refeições
      if (mealType === 'breakfast' || mealType === 'dinner') {
        targetMacros.protein *= 1.1; // 10% extra de proteína no café da manhã e jantar
      }
    }
    if (globalAdjustmentFactor.carbsFactor) {
      targetMacros.carbs *= globalAdjustmentFactor.carbsFactor;
    }
    if (globalAdjustmentFactor.fatFactor) {
      targetMacros.fat *= globalAdjustmentFactor.fatFactor;
      
      // Redução de gorduras no jantar
      if (mealType === 'dinner') {
        targetMacros.fat *= 0.9; // 10% menos gordura no jantar
      }
    }
  }

  // Calcular calorias alvo
  const targetCalories = (targetMacros.protein * 4) + (targetMacros.carbs * 4) + (targetMacros.fat * 9);

  // Gerar sugestões baseadas nos alimentos padrão para esta refeição
  const suggestedFoods = generateSuggestedFoodsForMeal(mealConfig.defaultFoods, targetMacros);

  // Aplicar um fator de ajuste para garantir que não ultrapasse os objetivos
  const adjustedSuggestedFoods = adjustPortionsToFitMacroTargets(
    suggestedFoods, 
    targetMacros,
    getMealTypeFactor(mealType, userNutritionGoals.meals)
  );

  // Calcular totais de macros para as sugestões
  const macroTotals = calculateMacroTotals(adjustedSuggestedFoods);

  // Gerar mensagem de motivo para a sugestão
  const reasonForSuggestion = generateReasonForSuggestion(mealType, targetCalories, userNutritionGoals.calories);

  return {
    id: uuidv4(),
    mealId,
    mealName,
    suggestedFoods: adjustedSuggestedFoods,
    macroTotals,
    reasonForSuggestion
  };
}

// Função para gerar sugestões de alimentos para uma refeição
function generateSuggestedFoodsForMeal(
  defaultFoodNames: string[],
  targetMacros: { protein: number; carbs: number; fat: number }
): SuggestedFood[] {
  // Mapear alimentos padrão para objetos FoodSuggestion
  const defaultFoods = defaultFoodNames.map(name => {
    const food = foodDatabase.find(f => f.name === name);
    
    if (!food) {
      throw new Error(`Alimento não encontrado: ${name}`);
    }
    
    return food;
  });

  // Categorizar os alimentos
  const proteinFoods = defaultFoods.filter(food => food.category === 'protein');
  const carbFoods = defaultFoods.filter(food => food.category === 'carb');
  const fatFoods = defaultFoods.filter(food => food.category === 'fat');
  const otherFoods = defaultFoods.filter(food => 
    !['protein', 'carb', 'fat'].includes(food.category));

  // Distribuir os macronutrientes alvo entre os alimentos de cada categoria
  const suggestedFoods: SuggestedFood[] = [];

  // Adicionar proteínas
  if (proteinFoods.length > 0) {
    const proteinPerFood = targetMacros.protein / proteinFoods.length;
    
    for (const food of proteinFoods) {
      const calculatedPortion = calculatePortionForProtein(food, proteinPerFood);
      const substitutes = getSubstitutesForFood(food.id);
      
      suggestedFoods.push({
        food,
        calculatedPortion,
        substitutes
      });
    }
  }

  // Adicionar carboidratos
  if (carbFoods.length > 0) {
    const carbsPerFood = targetMacros.carbs / carbFoods.length;
    
    for (const food of carbFoods) {
      const calculatedPortion = calculatePortionForCarbs(food, carbsPerFood);
      const substitutes = getSubstitutesForFood(food.id);
      
      suggestedFoods.push({
        food,
        calculatedPortion,
        substitutes
      });
    }
  }

  // Adicionar gorduras
  if (fatFoods.length > 0) {
    const fatPerFood = targetMacros.fat / fatFoods.length;
    
    for (const food of fatFoods) {
      const calculatedPortion = calculatePortionForFat(food, fatPerFood);
      const substitutes = getSubstitutesForFood(food.id);
      
      suggestedFoods.push({
        food,
        calculatedPortion,
        substitutes
      });
    }
  }

  // Adicionar outros alimentos (frutas, vegetais)
  for (const food of otherFoods) {
    // Para outros alimentos, ajustar a porção padrão para não sobrecarregar
    let portionFactor = 0.75; // 75% da porção padrão
    
    // Se for fruta, reduzir mais para controlar carboidratos
    if (food.category === 'fruit') {
      portionFactor = 0.6;
    }
    
    suggestedFoods.push({
      food,
      calculatedPortion: Math.round(food.portion * portionFactor / 5) * 5,
      substitutes: getSubstitutesForFood(food.id)
    });
  }

  return suggestedFoods;
}

// Função para ajustar porções para se adequar aos macros alvo
function adjustPortionsToFitMacroTargets(
  suggestedFoods: SuggestedFood[],
  targetMacros: { protein: number; carbs: number; fat: number },
  mealTypeFactor: number
): SuggestedFood[] {
  const currentMacros = calculateMacroTotals(suggestedFoods);
  
  // Calcular fatores de ajuste mais precisos e menos restritivos
  // Proteína: ajuste mais agressivo para atingir o objetivo
  const proteinRatio = targetMacros.protein / currentMacros.protein;
  const proteinAdjustment = Math.min(proteinRatio * mealTypeFactor, 1.15) * ADJUSTMENT_CONFIG.PROTEIN_SAFETY_MARGIN;
  
  // Carboidratos: ajuste menos conservador
  const carbsRatio = targetMacros.carbs / currentMacros.carbs;
  const carbsAdjustment = Math.min(carbsRatio * mealTypeFactor, 1.02) * ADJUSTMENT_CONFIG.CARBS_SAFETY_MARGIN;
  
  // Gorduras: ajuste mais restritivo para evitar excesso
  const fatRatio = targetMacros.fat / currentMacros.fat;
  const fatAdjustment = Math.min(fatRatio * (mealTypeFactor * 0.9), 0.95) * ADJUSTMENT_CONFIG.FAT_SAFETY_MARGIN;
  
  // Aplicar ajustes às porções
  return suggestedFoods.map(suggestedFood => {
    const { food, calculatedPortion } = suggestedFood;
    let adjustedPortion = calculatedPortion;
    
    if (food.category === 'protein') {
      adjustedPortion = Math.round(calculatedPortion * proteinAdjustment / 5) * 5;
    } else if (food.category === 'carb') {
      adjustedPortion = Math.round(calculatedPortion * carbsAdjustment / 5) * 5;
    } else if (food.category === 'fat') {
      adjustedPortion = Math.round(calculatedPortion * fatAdjustment / 5) * 5;
    } else if (food.category === 'fruit') {
      // Reduzir frutas menos agressivamente
      adjustedPortion = Math.round(calculatedPortion * 0.9 / 5) * 5;
    }
    
    // Garantir que a porção não seja menor que 5g
    adjustedPortion = Math.max(adjustedPortion, 5);
    
    // Calcular unidades se o alimento usar outra unidade de medida além de gramas
    let calculatedUnits = undefined;
    if (food.measurementUnit && food.measurementUnit !== 'g' && food.unitEquivalentInGrams) {
      // Calcular quantas unidades correspondem à porção ajustada
      calculatedUnits = parseFloat((adjustedPortion / food.unitEquivalentInGrams).toFixed(1));
      
      // Se for muito próximo de um número inteiro, arredonda
      if (Math.abs(calculatedUnits - Math.round(calculatedUnits)) < 0.1) {
        calculatedUnits = Math.round(calculatedUnits);
      }
      
      // Ajustar a porção em gramas para corresponder a um número mais limpo de unidades
      // Por exemplo, se calculamos 2.1 ovos, arredondamos para 2 ovos e ajustamos a porção em gramas
      const roundedUnits = (calculatedUnits < 0.5) ? 0.5 : Math.round(calculatedUnits * 2) / 2; // Arredondar para 0.5 mais próximo
      adjustedPortion = roundedUnits * food.unitEquivalentInGrams;
      calculatedUnits = roundedUnits;
    }
    
    return {
      ...suggestedFood,
      calculatedPortion: adjustedPortion,
      calculatedUnits
    };
  });
}

// Função para obter fator de ajuste com base no tipo de refeição, considerando o número de refeições
function getMealTypeFactor(mealType: string, totalMeals: number = 4): number {
  // Fatores base para cada tipo de refeição - valores aumentados para serem menos restritivos
  const baseFactors: Record<string, number> = {
    'breakfast': 0.95,  // Aumentado de 0.9 para 0.95
    'lunch': 0.98,      // Aumentado de 0.95 para 0.98
    'dinner': 0.96,     // Aumentado de 0.92 para 0.96
    'snack': 0.85,      // Aumentado de 0.8 para 0.85
    'morning-snack': 0.85,  // Aumentado de 0.75 para 0.85
    'afternoon-snack': 0.85, // Aumentado de 0.75 para 0.85
    'night-snack': 0.8,      // Aumentado de 0.7 para 0.8
    'pre-workout': 0.85,     // Aumentado de 0.75 para 0.85
    'post-workout': 0.9,     // Aumentado de 0.85 para 0.9
  };
  
  const baseFactor = baseFactors[mealType] || 0.9; // Valor default aumentado
  
  // Ajuste adicional com base no número de refeições - menos restritivo
  // Quanto mais refeições, mais restritivo precisamos ser, mas menos que antes
  const mealCountAdjustment = Math.max(0.9, 1 - (totalMeals - 3) * 0.03);
  
  return baseFactor * mealCountAdjustment;
}

// Calcular porção necessária para atingir quantidade específica de proteína
function calculatePortionForProtein(food: FoodSuggestion, targetProtein: number): number {
  if (food.protein === 0) return food.portion;
  
  // Calcular quanto da porção padrão é necessário, com um fator de segurança de 1.05 (5% a mais)
  const safetyFactor = 1.05;
  const portionMultiplier = (targetProtein / food.protein) * safetyFactor;
  const calculatedPortion = food.portion * portionMultiplier;
  
  // Arredondar para múltiplos de 5g para facilitar a medição, com um ajuste para cima
  // para garantir que atendemos o requisito de proteína
  return Math.ceil(calculatedPortion / 5) * 5;
}

// Calcular porção necessária para atingir quantidade específica de carboidratos
function calculatePortionForCarbs(food: FoodSuggestion, targetCarbs: number): number {
  if (food.carbs === 0) return food.portion;
  
  // Calcular quanto da porção padrão é necessário
  const portionMultiplier = targetCarbs / food.carbs;
  const calculatedPortion = food.portion * portionMultiplier;
  
  // Arredondar para múltiplos de 5g para facilitar a medição, com um pequeno ajuste para cima
  // para garantir que atendemos o requisito de carboidratos
  return Math.ceil(calculatedPortion / 5) * 5;
}

// Calcular porção necessária para atingir quantidade específica de gordura
function calculatePortionForFat(food: FoodSuggestion, targetFat: number): number {
  if (food.fat === 0) return food.portion;
  
  // Calcular quanto da porção padrão é necessário
  const portionMultiplier = targetFat / food.fat;
  const calculatedPortion = food.portion * portionMultiplier;
  
  // Arredondar para múltiplos de 5g para facilitar a medição, com um pequeno ajuste conservador
  // para evitar excesso de gordura, mas ainda atingir valores próximos ao alvo
  return Math.round(calculatedPortion / 5) * 5;
}

// Obter substituições disponíveis para um alimento
function getSubstitutesForFood(foodId: string): FoodSuggestion[] {
  const food = findFoodById(foodId);
  if (!food || !food.substitutes) return [];
  
  return food.substitutes
    .map(subId => findFoodById(subId))
    .filter((sub): sub is FoodSuggestion => sub !== undefined);
}

// Calcular totais de macros para as sugestões de alimentos
function calculateMacroTotals(suggestedFoods: SuggestedFood[]) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  for (const suggested of suggestedFoods) {
    const { food, calculatedPortion } = suggested;
    const portionRatio = calculatedPortion / food.portion;
    
    totalCalories += food.calories * portionRatio;
    totalProtein += food.protein * portionRatio;
    totalCarbs += food.carbs * portionRatio;
    totalFat += food.fat * portionRatio;
  }
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat)
  };
}

// Gerar mensagem de motivo para a sugestão
function generateReasonForSuggestion(mealType: string, targetCalories: number, totalDailyCalories: number): string {
  const percentage = Math.round((targetCalories / totalDailyCalories) * 100);
  
  const reasonsByMealType: Record<string, string> = {
    'breakfast': `Esta refeição foi planejada para fornecer aproximadamente ${percentage}% das suas necessidades calóricas diárias, com foco em proteínas de qualidade e carboidratos complexos para iniciar seu dia com energia estável.`,
    'lunch': `Esta refeição representa cerca de ${percentage}% das suas calorias diárias, balanceada para dar energia e saciedade durante o período da tarde.`,
    'dinner': `Esta refeição contém aproximadamente ${percentage}% das suas calorias diárias, formulada para promover saciedade e recuperação muscular durante o período noturno.`,
    'snack': `Este lanche fornece aproximadamente ${percentage}% das suas necessidades calóricas diárias, ideal para manter os níveis de energia entre as refeições principais.`
  };
  
  return reasonsByMealType[mealType] || 
    `Esta refeição foi planejada para fornecer aproximadamente ${percentage}% das suas necessidades calóricas diárias.`;
}

// Função auxiliar para determinar o tipo de refeição a partir do ID
function getMealTypeFromId(mealId: string): string {
  // Mapeamento direto de IDs para tipos de refeição
  const mealTypes: Record<string, string> = {
    'breakfast': 'breakfast',
    'lunch': 'lunch',
    'dinner': 'dinner',
    'morning-snack': 'snack',
    'afternoon-snack': 'snack',
    'night-snack': 'snack',
    'pre-workout': 'snack',
    'post-workout': 'snack',
    // Adicionando suporte para ids diferentes/simplificados
    'cafe': 'breakfast',     // café da manhã
    'almoco': 'lunch',       // almoço
    'janta': 'dinner',       // jantar
    'lanche': 'snack',       // lanche
    'colacao': 'snack',      // colação/lanche da manhã 
    'lancheManha': 'snack',  // lanche da manhã
    'lancheTarde': 'snack',  // lanche da tarde
    'lancheNoite': 'snack',  // lanche da noite
    'ceia': 'snack',         // ceia
    'preWorkout': 'snack',   // pré-treino
    'posWorkout': 'snack'    // pós-treino
  };
  
  // Verificar se existe um mapeamento direto
  if (mealTypes[mealId]) {
    return mealTypes[mealId];
  }
  
  // Se não encontrar, inferir o tipo por conteúdo
  const mealIdLower = mealId.toLowerCase();
  
  if (mealIdLower.includes('breakfast') || mealIdLower.includes('cafe') || mealIdLower.includes('manhã')) {
    return 'breakfast';
  } else if (mealIdLower.includes('lunch') || mealIdLower.includes('almoco') || mealIdLower.includes('almoço')) {
    return 'lunch';
  } else if (mealIdLower.includes('dinner') || mealIdLower.includes('janta') || mealIdLower.includes('jantar')) {
    return 'dinner';
  } else if (mealIdLower.includes('snack') || mealIdLower.includes('lanche') || mealIdLower.includes('colacao') || 
            mealIdLower.includes('ceia') || mealIdLower.includes('workout')) {
    return 'snack';
  }
  
  // Se nada coincidir, padrão para snack (menor impacto)
  return 'snack';
}

// Função para gerar sugestões para todas as refeições do usuário com otimização iterativa
export function generateAllMealSuggestions(
  meals: { id: string; name: string }[],
  userNutritionGoals: UserNutritionGoals
): NutritionSuggestion[] {
  // Primeira iteração: gerar sugestões iniciais sem ajustes globais
  let suggestions = meals.map(meal => 
    generateMealSuggestion(meal.id, meal.name, userNutritionGoals)
  );
  
  // Processo iterativo de otimização para atingir as metas
  let currentIteration = 0;
  let currentTotalMacros = calculateTotalMacrosForAllSuggestions(suggestions);
  
  // Verificar quão próximo estamos das metas
  let proteinDiff = Math.abs(currentTotalMacros.protein / userNutritionGoals.protein - 1);
  let carbsDiff = Math.abs(currentTotalMacros.carbs / userNutritionGoals.carbs - 1);
  let fatDiff = Math.abs(currentTotalMacros.fat / userNutritionGoals.fat - 1);
  
  // Enquanto houver diferenças significativas e não excedermos o máximo de iterações
  while (
    (proteinDiff > ADJUSTMENT_CONFIG.TOLERANCE_PERCENTAGE || 
     carbsDiff > ADJUSTMENT_CONFIG.TOLERANCE_PERCENTAGE || 
     fatDiff > ADJUSTMENT_CONFIG.TOLERANCE_PERCENTAGE) &&
    currentIteration < ADJUSTMENT_CONFIG.MAX_ITERATIONS
  ) {
    // Calcular fatores de ajuste globais
    const globalAdjustmentFactors = {
      proteinFactor: userNutritionGoals.protein / currentTotalMacros.protein,
      carbsFactor: userNutritionGoals.carbs / currentTotalMacros.carbs,
      fatFactor: userNutritionGoals.fat / currentTotalMacros.fat,
      caloriesFactor: userNutritionGoals.calories / currentTotalMacros.calories
    };
    
    // Aplicar ajustes progressivamente mais agressivos a cada iteração
    const iterationIntensity = 1 + (currentIteration * 0.2); // Intensificar mais os ajustes a cada iteração (aumentado de 0.15 para 0.2)
    
    // Estabilizar fatores para não causarem oscilações extremas
    const stabilizedFactors = {
      proteinFactor: adjustFactorWithStability(globalAdjustmentFactors.proteinFactor, iterationIntensity),
      carbsFactor: adjustFactorWithStability(globalAdjustmentFactors.carbsFactor, iterationIntensity),
      fatFactor: adjustFactorWithStability(globalAdjustmentFactors.fatFactor, iterationIntensity),
      caloriesFactor: globalAdjustmentFactors.caloriesFactor // Apenas para referência
    };
    
    // Gerar novas sugestões com os fatores ajustados
    suggestions = meals.map(meal => 
      generateMealSuggestion(meal.id, meal.name, userNutritionGoals, stabilizedFactors)
    );
    
    // Recalcular totais e diferenças
    currentTotalMacros = calculateTotalMacrosForAllSuggestions(suggestions);
    proteinDiff = Math.abs(currentTotalMacros.protein / userNutritionGoals.protein - 1);
    carbsDiff = Math.abs(currentTotalMacros.carbs / userNutritionGoals.carbs - 1);
    fatDiff = Math.abs(currentTotalMacros.fat / userNutritionGoals.fat - 1);
    
    currentIteration++;
  }
  
  // Ajuste final após todas as iterações
  // Aplicar escalonamento proporcional se ainda houver desajustes
  if (currentIteration >= ADJUSTMENT_CONFIG.MAX_ITERATIONS) {
    suggestions = applyFinalProportionalAdjustment(suggestions, userNutritionGoals);
  }

  // Verificação final: se ainda há discrepância significativa, aplica um último ajuste agressivo
  const finalTotals = calculateTotalMacrosForAllSuggestions(suggestions);
  const finalDiffCals = Math.abs(finalTotals.calories / userNutritionGoals.calories - 1);
  const finalDiffProtein = Math.abs(finalTotals.protein / userNutritionGoals.protein - 1);
  const finalDiffFat = finalTotals.fat / userNutritionGoals.fat;

  // Condição mais sensível para proteínas (aciona ajuste se proteína estiver abaixo de 5% ou gordura acima de 10%)
  if (finalDiffCals > 0.05 || finalDiffProtein > 0.05 || finalDiffFat > 1.1) { 
    console.log("Aplicando ajuste final agressivo. Diferença calórica atual:", finalDiffCals);
    console.log("Diferença proteica atual:", finalDiffProtein);
    console.log("Razão de gordura atual:", finalDiffFat);
    
    // Criar um mapa de distribuição de calorias e proteínas por refeição
    const mealDistribution = suggestions.map(s => ({
      mealId: s.mealId,
      calories: s.macroTotals.calories,
      protein: s.macroTotals.protein,
      fat: s.macroTotals.fat,
      percentageCalories: s.macroTotals.calories / finalTotals.calories,
      percentageProtein: s.macroTotals.protein / finalTotals.protein
    }));
    
    // Calcular os novos alvos para cada refeição
    const newMealTargets = mealDistribution.map(meal => ({
      mealId: meal.mealId,
      targetCalories: Math.round(userNutritionGoals.calories * meal.percentageCalories),
      targetProtein: Math.round(userNutritionGoals.protein * meal.percentageProtein),
      targetFat: Math.round(userNutritionGoals.fat * (meal.fat / finalTotals.fat))
    }));
    
    // Ajustar cada sugestão para os novos alvos
    suggestions = suggestions.map(suggestion => {
      const mealTarget = newMealTargets.find(t => t.mealId === suggestion.mealId);
      if (!mealTarget) return suggestion;
      
      const calorieRatio = mealTarget.targetCalories / suggestion.macroTotals.calories;
      const proteinRatio = mealTarget.targetProtein / suggestion.macroTotals.protein;
      const fatRatio = mealTarget.targetFat / suggestion.macroTotals.fat;
      
      // Ajuste adicional para proteínas se o total está muito baixo
      const proteinBoost = finalTotals.protein < userNutritionGoals.protein * 0.9 ? 1.15 : 1.0;
      // Ajuste adicional para gorduras se o total está muito alto
      const fatReduction = finalTotals.fat > userNutritionGoals.fat * 1.1 ? 0.85 : 1.0;
      
      // Aplicar o ajuste a todos os alimentos da sugestão
      const adjustedFoods = suggestion.suggestedFoods.map(food => {
        // Definir o ratio específico com base na categoria do alimento
        let adjustmentRatio = calorieRatio;
        
        if (food.food.category === 'protein') {
          // Para proteínas, usar um ratio que priorize atingir a meta de proteínas
          adjustmentRatio = Math.max(calorieRatio, proteinRatio * proteinBoost);
        } else if (food.food.category === 'fat') {
          // Para gorduras, usar um ratio que controle melhor o excesso
          adjustmentRatio = Math.min(calorieRatio, fatRatio * fatReduction);
        }
        
        // Ajustar a porção proporcionalmente
        const newPortion = Math.round(food.calculatedPortion * adjustmentRatio / 5) * 5;
        
        // Recalcular unidades, se necessário
        let newUnits = food.calculatedUnits;
        if (food.food.measurementUnit && food.food.measurementUnit !== 'g' && food.food.unitEquivalentInGrams) {
          newUnits = parseFloat((newPortion / food.food.unitEquivalentInGrams).toFixed(1));
          if (Math.abs(newUnits - Math.round(newUnits)) < 0.1) {
            newUnits = Math.round(newUnits);
          }
        }
        
        return {
          ...food,
          calculatedPortion: Math.max(newPortion, 5),
          calculatedUnits: newUnits
        };
      });
      
      // Recalcular os macros totais
      const macroTotals = calculateMacroTotals(adjustedFoods);
      
      return {
        ...suggestion,
        suggestedFoods: adjustedFoods,
        macroTotals
      };
    });
  }
  
  return suggestions;
}

// Função para ajustar fatores de forma estável, evitando oscilações
function adjustFactorWithStability(factor: number, intensityMultiplier: number): number {
  // Definir limites para evitar fatores extremos
  const maxFactor = 1.1;
  const minFactor = 0.8;
  
  // Calcular o ajuste, intensificando à medida que as iterações avançam
  let adjustedFactor = 1 + ((factor - 1) * intensityMultiplier);
  
  // Manter dentro dos limites
  adjustedFactor = Math.min(Math.max(adjustedFactor, minFactor), maxFactor);
  
  return adjustedFactor;
}

// Função para ajuste proporcional final (escalonamento)
function applyFinalProportionalAdjustment(
  suggestions: NutritionSuggestion[],
  userNutritionGoals: UserNutritionGoals
): NutritionSuggestion[] {
  // Calcular totais atuais
  const currentTotalMacros = calculateTotalMacrosForAllSuggestions(suggestions);
  
  // Calcular fatores de escalonamento diretos - mais agressivos para chegar mais perto do alvo
  const scalingFactors = {
    protein: userNutritionGoals.protein / currentTotalMacros.protein,
    carbs: userNutritionGoals.carbs / currentTotalMacros.carbs,
    fat: userNutritionGoals.fat / currentTotalMacros.fat
  };
  
  // Aplicar um escalonamento mais agressivo para proteínas, mais conservador para gorduras
  const enhancedScalingFactors = {
    protein: 1 + ((scalingFactors.protein - 1) * 1.4), // 40% mais agressivo para proteínas
    carbs: 1 + ((scalingFactors.carbs - 1) * 1.2),     // 20% mais agressivo para carboidratos
    fat: 1 + ((scalingFactors.fat - 1) * 0.9)          // 10% menos agressivo para gorduras
  };
  
  // Ajustar cada sugestão proporcionalmente
  return suggestions.map(suggestion => {
    // Ajustar cada alimento dentro da sugestão
    const adjustedFoods = suggestion.suggestedFoods.map(suggestedFood => {
      const { food, calculatedPortion } = suggestedFood;
      let newPortion = calculatedPortion;
      
      // Ajustar porção com base no macronutriente predominante do alimento
      if (food.category === 'protein') {
        newPortion = Math.round(calculatedPortion * enhancedScalingFactors.protein / 5) * 5;
      } else if (food.category === 'carb') {
        newPortion = Math.round(calculatedPortion * enhancedScalingFactors.carbs / 5) * 5;
      } else if (food.category === 'fat') {
        newPortion = Math.round(calculatedPortion * enhancedScalingFactors.fat / 5) * 5;
      } else if (food.category === 'fruit') {
        // Frutas são ajustadas principalmente pelo conteúdo de carboidratos, com menor redução
        newPortion = Math.round(calculatedPortion * enhancedScalingFactors.carbs * 0.95 / 5) * 5;
      }
      
      // Garantir mínimo
      newPortion = Math.max(newPortion, 5);
      
      // Recalcular unidades se aplicável
      let calculatedUnits = undefined;
      if (food.measurementUnit && food.measurementUnit !== 'g' && food.unitEquivalentInGrams) {
        calculatedUnits = parseFloat((newPortion / food.unitEquivalentInGrams).toFixed(1));
        if (Math.abs(calculatedUnits - Math.round(calculatedUnits)) < 0.1) {
          calculatedUnits = Math.round(calculatedUnits);
        }
        
        const roundedUnits = (calculatedUnits < 0.5) ? 0.5 : Math.round(calculatedUnits * 2) / 2;
        newPortion = roundedUnits * food.unitEquivalentInGrams;
        calculatedUnits = roundedUnits;
      }
      
      return {
        ...suggestedFood,
        calculatedPortion: newPortion,
        calculatedUnits
      };
    });
    
    // Recalcular totais para esta sugestão
    const macroTotals = calculateMacroTotals(adjustedFoods);
    
    // Retornar a sugestão ajustada
    return {
      ...suggestion,
      suggestedFoods: adjustedFoods,
      macroTotals
    };
  });
}

// Calcular o total de macros para todas as sugestões
function calculateTotalMacrosForAllSuggestions(suggestions: NutritionSuggestion[]) {
  return suggestions.reduce(
    (total, suggestion) => {
      return {
        calories: total.calories + suggestion.macroTotals.calories,
        protein: total.protein + suggestion.macroTotals.protein,
        carbs: total.carbs + suggestion.macroTotals.carbs,
        fat: total.fat + suggestion.macroTotals.fat
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Função para recalcular as porções quando o usuário muda um item
export function recalculateSuggestionWithFoodChange(
  suggestion: NutritionSuggestion,
  originalFoodId: string,
  newFoodId: string,
  userNutritionGoals: UserNutritionGoals
): NutritionSuggestion {
  // Encontrar o índice do alimento original
  const foodIndex = suggestion.suggestedFoods.findIndex(
    item => item.food.id === originalFoodId
  );
  
  if (foodIndex === -1) {
    throw new Error('Alimento original não encontrado na sugestão');
  }
  
  // Encontrar o novo alimento
  const newFood = findFoodById(newFoodId);
  if (!newFood) {
    throw new Error('Novo alimento não encontrado');
  }
  
  // Criar uma cópia das sugestões de alimentos
  const updatedSuggestedFoods = [...suggestion.suggestedFoods];
  
  // Determinar a categoria do alimento e os macros alvo
  const foodCategory = updatedSuggestedFoods[foodIndex].food.category;
  const mealType = getMealTypeFromId(suggestion.mealId);
  const mealConfig = mealTypeConfigs[mealType as keyof typeof mealTypeConfigs];
  
  if (!mealConfig) {
    throw new Error(`Configuração não encontrada para o tipo de refeição: ${mealType}`);
  }
  
  // Calcular macros alvos para esta refeição
  const targetMacros = {
    protein: userNutritionGoals.protein * mealConfig.baseMacroDistribution.protein,
    carbs: userNutritionGoals.carbs * mealConfig.baseMacroDistribution.carbs,
    fat: userNutritionGoals.fat * mealConfig.baseMacroDistribution.fat
  };
  
  // Calcular a nova porção com base na categoria do alimento
  let calculatedPortion = newFood.portion;
  
  if (foodCategory === 'protein') {
    // Contar quantos alimentos de proteína existem na sugestão
    const proteinFoodsCount = updatedSuggestedFoods.filter(
      item => item.food.category === 'protein'
    ).length;
    
    // Distribuir a proteína alvo entre os alimentos
    const proteinPerFood = targetMacros.protein / proteinFoodsCount;
    calculatedPortion = calculatePortionForProtein(newFood, proteinPerFood);
  } 
  else if (foodCategory === 'carb') {
    const carbFoodsCount = updatedSuggestedFoods.filter(
      item => item.food.category === 'carb'
    ).length;
    
    const carbsPerFood = targetMacros.carbs / carbFoodsCount;
    calculatedPortion = calculatePortionForCarbs(newFood, carbsPerFood);
  } 
  else if (foodCategory === 'fat') {
    const fatFoodsCount = updatedSuggestedFoods.filter(
      item => item.food.category === 'fat'
    ).length;
    
    const fatPerFood = targetMacros.fat / fatFoodsCount;
    calculatedPortion = calculatePortionForFat(newFood, fatPerFood);
  }
  
  // Aplicar um fator de segurança para evitar excesso
  calculatedPortion = Math.round(calculatedPortion * ADJUSTMENT_CONFIG.PROTEIN_SAFETY_MARGIN / 5) * 5;
  
  // Atualizar o alimento na lista
  updatedSuggestedFoods[foodIndex] = {
    food: newFood,
    calculatedPortion,
    substitutes: getSubstitutesForFood(newFood.id)
  };
  
  // Aplicar fator de ajuste para não ultrapassar os objetivos 
  const adjustedSuggestedFoods = adjustPortionsToFitMacroTargets(
    updatedSuggestedFoods,
    targetMacros,
    getMealTypeFactor(mealType, userNutritionGoals.meals)
  );
  
  // Recalcular os totais de macros
  const macroTotals = calculateMacroTotals(adjustedSuggestedFoods);
  
  // Retornar a sugestão atualizada
  return {
    ...suggestion,
    suggestedFoods: adjustedSuggestedFoods,
    macroTotals
  };
}

// Função para ajustar porção de um alimento na sugestão
export function adjustFoodPortion(
  suggestion: NutritionSuggestion,
  foodId: string,
  newPortion: number
): NutritionSuggestion {
  // Encontrar o índice do alimento
  const foodIndex = suggestion.suggestedFoods.findIndex(
    item => item.food.id === foodId
  );
  
  if (foodIndex === -1) {
    throw new Error('Alimento não encontrado na sugestão');
  }
  
  // Criar uma cópia das sugestões de alimentos
  const updatedSuggestedFoods = [...suggestion.suggestedFoods];
  const food = updatedSuggestedFoods[foodIndex].food;
  
  // Atualizar a porção e calcular unidades se necessário
  let calculatedUnits = undefined;
  if (food.measurementUnit && food.measurementUnit !== 'g' && food.unitEquivalentInGrams) {
    calculatedUnits = parseFloat((newPortion / food.unitEquivalentInGrams).toFixed(1));
    
    // Se for muito próximo de um número inteiro, arredonda
    if (Math.abs(calculatedUnits - Math.round(calculatedUnits)) < 0.1) {
      calculatedUnits = Math.round(calculatedUnits);
    }
  }
  
  updatedSuggestedFoods[foodIndex] = {
    ...updatedSuggestedFoods[foodIndex],
    calculatedPortion: newPortion,
    calculatedUnits
  };
  
  // Recalcular os totais de macros
  const macroTotals = calculateMacroTotals(updatedSuggestedFoods);
  
  // Retornar a sugestão atualizada
  return {
    ...suggestion,
    suggestedFoods: updatedSuggestedFoods,
    macroTotals
  };
}

// Função para atualizar a porção com base em unidades (como ovos, fatias, etc.)
export function adjustFoodUnit(
  suggestion: NutritionSuggestion,
  foodId: string,
  newUnits: number
): NutritionSuggestion {
  // Encontrar o índice do alimento
  const foodIndex = suggestion.suggestedFoods.findIndex(
    item => item.food.id === foodId
  );
  
  if (foodIndex === -1) {
    throw new Error('Alimento não encontrado na sugestão');
  }
  
  const food = suggestion.suggestedFoods[foodIndex].food;
  
  // Verificar se o alimento usa unidades
  if (!food.measurementUnit || food.measurementUnit === 'g' || !food.unitEquivalentInGrams) {
    throw new Error('Este alimento não suporta unidades de medida alternativas');
  }
  
  // Calcular a nova porção em gramas
  const newPortion = newUnits * food.unitEquivalentInGrams;
  
  // Usar a função existente para ajustar a porção
  return adjustFoodPortion(suggestion, foodId, newPortion);
}

// Função para converter a sugestão em alimentos prontos para adicionar ao diário
export function convertSuggestionToFoods(suggestion: NutritionSuggestion) {
  return suggestion.suggestedFoods.map(suggestedFood => {
    const { food, calculatedPortion } = suggestedFood;
    const portionRatio = calculatedPortion / food.portion;
    
    return {
      id: uuidv4(),
      name: food.name,
      portion: calculatedPortion,
      calories: Math.round(food.calories * portionRatio),
      protein: Math.round(food.protein * portionRatio * 10) / 10,
      carbs: Math.round(food.carbs * portionRatio * 10) / 10,
      fat: Math.round(food.fat * portionRatio * 10) / 10
    };
  });
} 