import { MealType } from "../context/MealContext";
import { NutritionInfo } from "../context/NutritionContext";

export interface MealNutritionRecommendation {
  mealId: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reasonForSuggestion: string;
  percentageOfDaily: number;
}

// Interface para armazenar configurações personalizadas de distribuição
export interface CustomMealDistribution {
  mealId: string;
  percentage: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Função principal para distribuir os macros entre as refeições
export function generateMealDistribution(
  nutritionInfo: NutritionInfo,
  mealTypes: MealType[],
  customDistribution?: CustomMealDistribution[]
): MealNutritionRecommendation[] {
  // Validar se temos dados suficientes
  if (
    !nutritionInfo?.calories ||
    !nutritionInfo?.protein ||
    !nutritionInfo?.carbs ||
    !nutritionInfo?.fat ||
    !mealTypes?.length
  ) {
    return [];
  }

  // Filtrar a distribuição personalizada para remover refeições que não existem mais
  // Se uma refeição foi removida, não devemos considerar sua distribuição personalizada
  let validCustomDistribution: CustomMealDistribution[] | undefined = undefined;

  if (customDistribution && customDistribution.length > 0) {
    // Criar um set com os IDs das refeições atuais para busca eficiente
    const currentMealIds = new Set(mealTypes.map((meal) => meal.id));

    // Filtrar apenas as refeições que ainda existem
    validCustomDistribution = customDistribution.filter((dist) =>
      currentMealIds.has(dist.mealId)
    );

    // Se após a filtragem não sobrou nenhuma configuração válida,
    // consideramos que a distribuição personalizada deve ser descartada
    if (validCustomDistribution.length === 0) {
      validCustomDistribution = undefined;
    }

    // NOVA LÓGICA: Se ainda temos distribuições válidas mas houve mudança na quantidade de refeições,
    // precisamos redistribuir os percentuais para manter a proporção relativa
    else if (validCustomDistribution.length !== customDistribution.length) {
      // Calcular a soma dos percentuais das refeições válidas
      const totalValidPercentage = validCustomDistribution.reduce(
        (sum, dist) => sum + dist.percentage,
        0
      );

      // Redistribuir os percentuais para somar 100%
      validCustomDistribution = validCustomDistribution.map((dist) => {
        // Calcular a proporção relativa de cada refeição
        const proportion = dist.percentage / totalValidPercentage;

        // Aplicar a proporção para reajustar para o total de 100%
        const adjustedPercentage = Math.round(proportion * 100);

        return {
          ...dist,
          percentage: adjustedPercentage,
        };
      });

      // Verificar se o total está exatamente em 100% após o arredondamento
      const adjustedTotal = validCustomDistribution.reduce(
        (sum, dist) => sum + dist.percentage,
        0
      );

      // Ajustar a primeira refeição para garantir que somem exatamente 100%
      if (adjustedTotal !== 100 && validCustomDistribution.length > 0) {
        const diff = 100 - adjustedTotal;
        validCustomDistribution[0].percentage += diff;
      }
    }
  }

  // Definir porcentagens sugeridas por tipo de refeição
  const mealImportance: Record<string, number> = {
    breakfast: 0.25, // 25% das calorias diárias
    morning_snack: 0.1, // 10% das calorias diárias
    lunch: 0.25, // 25% das calorias diárias
    afternoon_snack: 0.1, // 10% das calorias diárias
    dinner: 0.2, // 20% das calorias diárias
    supper: 0.05, // 5% das calorias diárias
    snack: 0.05, // 5% das calorias diárias
  };

  // Calcular distribuição balanceada com base nos tipos de refeições disponíveis
  const balancedDistribution = createBalancedDistribution(
    mealTypes,
    mealImportance
  );

  // Usar distribuição balanceada como padrão
  let adjustedPercentages = balancedDistribution;

  // Se temos distribuição personalizada válida, usá-la em vez da balanceada
  if (validCustomDistribution && validCustomDistribution.length > 0) {
    // Converter o array de CustomMealDistribution para o formato Record<string, number>
    const customPercentages = validCustomDistribution.reduce((acc, item) => {
      // Verificar se o item é válido e tem um valor positivo
      if (item && item.mealId && item.percentage > 0) {
        acc[item.mealId] = item.percentage / 100; // Converter de porcentagem (ex: 25) para decimal (0.25)
      }
      return acc;
    }, {} as Record<string, number>);

    // Verificar se todas as refeições têm uma distribuição personalizada
    const allMealsHaveCustomDistribution = mealTypes.every(
      (meal) => customPercentages[meal.id] !== undefined
    );

    // MODIFICAÇÃO: Sempre usar a distribuição personalizada se ela existir para todas as refeições atuais
    if (allMealsHaveCustomDistribution) {
      // Normalizar para garantir que a soma seja 1
      const total = Object.values(customPercentages).reduce((a, b) => a + b, 0);

      // Sempre normalizar os valores para garantir consistência
      adjustedPercentages = {};
      Object.keys(customPercentages).forEach((key) => {
        adjustedPercentages[key] = customPercentages[key] / total;
      });
    }
    // Se nem todas as refeições tiverem distribuição personalizada, mantemos a balanceada
  }

  // Garantir que os valores nutricionais existam para prevenir erros
  const calories = nutritionInfo.calories || 0;
  const protein = nutritionInfo.protein || 0;
  const carbs = nutritionInfo.carbs || 0;
  const fat = nutritionInfo.fat || 0;

  // Primeira passagem: calcular percentuais e percentageOfDaily sem arredondamento
  const initialRecommendations = mealTypes.map((meal) => {
    // Obter o percentual ajustado para esta refeição
    const percentage = adjustedPercentages[meal.id] || 1 / mealTypes.length;

    // Encontrar a configuração personalizada de macros para esta refeição
    const mealConfig = validCustomDistribution?.find(
      (config) => config.mealId === meal.id
    );

    // Verificar se existem macros personalizados para esta refeição
    const hasCustomMacros =
      mealConfig?.macros &&
      mealConfig.macros.protein > 0 &&
      mealConfig.macros.carbs > 0 &&
      mealConfig.macros.fat > 0;

    // Calcular a distribuição de calorias
    const mealCalories = Math.round(calories * percentage);

    // Calcular macros com base na personalização individual (se disponível)
    let mealProtein, mealCarbs, mealFat;

    if (hasCustomMacros) {
      // Usar distribuição personalizada de macros
      const macroPercentages = mealConfig!.macros!;

      // Calcular cada macro como uma porcentagem do total de calorias da refeição
      // Proteínas e carboidratos: 4 calorias por grama; Gorduras: 9 calorias por grama
      const totalCaloriesFromMacros = mealCalories;

      mealProtein = Math.round(
        (totalCaloriesFromMacros * (macroPercentages.protein / 100)) / 4
      );
      mealCarbs = Math.round(
        (totalCaloriesFromMacros * (macroPercentages.carbs / 100)) / 4
      );
      mealFat = Math.round(
        (totalCaloriesFromMacros * (macroPercentages.fat / 100)) / 9
      );
    } else {
      // Usar distribuição padrão (proporcional às calorias)
      mealProtein = Math.round(protein * percentage);
      mealCarbs = Math.round(carbs * percentage);
      mealFat = Math.round(fat * percentage);
    }

    // Gerar explicação personalizada
    const reasonForSuggestion = generateSuggestionReason(meal.id, percentage);

    return {
      mealId: meal.id,
      mealName: meal.name,
      calories: mealCalories,
      protein: mealProtein,
      carbs: mealCarbs,
      fat: mealFat,
      percentageOfDaily: percentage * 100,
      reasonForSuggestion,
    };
  });

  // Segunda passagem: ajustar macronutrientes para o café da manhã
  // Aumentar carboidratos e diminuir proteínas para facilitar o atingimento de metas
  const finalRecommendations = initialRecommendations.map((rec) => {
    // Verificar se é café da manhã
    if (rec.mealId === "breakfast") {
      // Ajustar apenas se não houver distribuição personalizada
      if (
        !validCustomDistribution?.find(
          (config) => config.mealId === "breakfast"
        )?.macros
      ) {
        // Aumentar carboidratos em 15% e reduzir proteínas em 15%
        const proteinAdjustment = Math.round(rec.protein * 0.15);

        return {
          ...rec,
          protein: rec.protein - proteinAdjustment,
          carbs: rec.carbs + proteinAdjustment,
        };
      }
    }
    return rec;
  });

  // Terceira passagem: arredondar valores para melhorar usabilidade
  return finalRecommendations.map((rec) => {
    // Arredondar valores para evitar números com muitas casas decimais
    return {
      ...rec,
      calories: Math.round(rec.calories),
      protein: Math.round(rec.protein),
      carbs: Math.round(rec.carbs),
      fat: Math.round(rec.fat),
      percentageOfDaily: Math.round(rec.percentageOfDaily),
    };
  });
}

// Função para criar uma distribuição balanceada com base nos tipos de refeições disponíveis
function createBalancedDistribution(
  meals: MealType[],
  mealImportance: Record<string, number>
): Record<string, number> {
  // Array para armazenar as refeições e suas porcentagens
  const distributions: { mealId: string; percentage: number }[] = [];
  let totalAssigned = 0;

  // Primeiro passo: atribuir valores conhecidos
  meals.forEach((meal) => {
    if (mealImportance[meal.id]) {
      distributions.push({
        mealId: meal.id,
        percentage: mealImportance[meal.id],
      });
      totalAssigned += mealImportance[meal.id];
    }
  });

  // Segundo passo: distribuir o restante (se houver)
  const unassignedMeals = meals.filter((meal) => !mealImportance[meal.id]);
  if (unassignedMeals.length > 0) {
    const remainingPercentage = 1 - totalAssigned;
    const equalRemaining = remainingPercentage / unassignedMeals.length;

    unassignedMeals.forEach((meal) => {
      distributions.push({
        mealId: meal.id,
        percentage: equalRemaining,
      });
    });
  }

  // Terceiro passo: normalizar para garantir que a soma seja exatamente 1 (100%)
  const total = distributions.reduce((sum, dist) => sum + dist.percentage, 0);
  if (Math.abs(total - 1) > 0.0001) {
    // Normalizar
    distributions.forEach((dist) => {
      dist.percentage = dist.percentage / total;
    });
  }

  // Converter para o formato Record<string, number>
  const result: Record<string, number> = {};
  distributions.forEach((dist) => {
    result[dist.mealId] = dist.percentage;
  });

  return result;
}

// Gerar explicação personalizada para cada refeição
function generateSuggestionReason(mealId: string, percentage: number): string {
  const percentText = Math.round(percentage * 100);

  switch (mealId) {
    case "breakfast":
      return `NOVA DISTRIBUIÇÃO: Café da manhã representa ${percentText}% das suas necessidades diárias. Uma distribuição maior para iniciar o dia com mais energia.`;
    case "morning_snack":
      return `NOVA DISTRIBUIÇÃO: Lanche da manhã representa ${percentText}% das suas necessidades nutricionais. Um lanche mais leve para manter a energia.`;
    case "lunch":
      return `NOVA DISTRIBUIÇÃO: Almoço corresponde a ${percentText}% do seu plano nutricional. Concentrando mais calorias no almoço para melhor desempenho durante o dia.`;
    case "afternoon_snack":
      return `NOVA DISTRIBUIÇÃO: Lanche da tarde representa ${percentText}% das suas necessidades nutricionais. Um pequeno impulso de energia para o restante do dia.`;
    case "dinner":
      return `NOVA DISTRIBUIÇÃO: Jantar com ${percentText}% das suas calorias diárias. Reduzido para uma digestão mais leve antes de dormir.`;
    case "supper":
      return `NOVA DISTRIBUIÇÃO: Ceia representa ${percentText}% das suas necessidades nutricionais. Uma pequena refeição antes de dormir.`;
    case "snack":
      return `NOVA DISTRIBUIÇÃO: Lanche representa ${percentText}% das suas necessidades nutricionais. Ideal para manter os níveis de energia equilibrados.`;
    default:
      return `NOVA DISTRIBUIÇÃO: Esta refeição representa ${percentText}% do seu plano nutricional diário.`;
  }
}

// Função para sugerir substituições baseadas no tipo de dieta
export function suggestDietSpecificAlternatives(
  dietType: "pescatarian" | "vegetarian" | "vegan",
  originalFoodId: string
): string[] {
  // Mapeamento de alimentos de origem animal para alternativas
  const dietSubstitutes: Record<string, Record<string, string[]>> = {
    // Opções para pescetarianos (sem carne, mas pode comer peixe)
    pescatarian: {
      sugg_frango: ["sugg_tilapia", "sugg_salmao", "sugg_atum"],
      sugg_coxa_frango: ["sugg_tilapia", "sugg_bacalhau"],
      sugg_peito_peru: ["sugg_atum", "sugg_tilapia", "sugg_sardinha"],
      sugg_patinho: ["sugg_salmao", "sugg_tilapia", "sugg_bacalhau"],
      sugg_alcatra: ["sugg_salmao", "sugg_atum", "sugg_bacalhau"],
      sugg_file_mignon: ["sugg_salmao", "sugg_bacalhau", "sugg_atum"],
    },

    // Opções para vegetarianos (sem carne nem peixe)
    vegetarian: {
      sugg_frango: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_coxa_frango: ["sugg_tofu", "sugg_grao_bico", "sugg_lentilha"],
      sugg_peito_peru: ["sugg_tofu", "sugg_ovo", "sugg_proteina_vegetal"],
      sugg_patinho: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_alcatra: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_file_mignon: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_tilapia: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_salmao: ["sugg_tofu", "sugg_ovo", "sugg_proteina_vegetal"],
      sugg_bacalhau: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_atum: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_sardinha: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
    },

    // Opções para veganos (sem produtos animais)
    vegan: {
      sugg_frango: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_coxa_frango: ["sugg_tofu", "sugg_grao_bico", "sugg_lentilha"],
      sugg_peito_peru: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_patinho: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_alcatra: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_file_mignon: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_tilapia: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_salmao: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_bacalhau: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_atum: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_sardinha: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_lentilha"],
      sugg_ovo: ["sugg_tofu", "sugg_proteina_vegetal", "sugg_grao_bico"],
      sugg_leite: ["sugg_leite_vegetal", "sugg_leite_coco", "sugg_leite_aveia"],
      sugg_iogurte: ["sugg_iogurte_vegetal", "sugg_leite_coco"],
      sugg_iogurte_desnatado: ["sugg_iogurte_vegetal", "sugg_leite_vegetal"],
      sugg_queijo: ["sugg_tofu", "sugg_pasta_amendoim"],
      sugg_queijo_cottage: ["sugg_tofu", "sugg_pasta_amendoim"],
      sugg_requeijao: ["sugg_pasta_amendoim", "sugg_abacate"],
      sugg_whey: ["sugg_proteina_vegetal", "sugg_proteina_ervilha"],
      sugg_albumina: ["sugg_proteina_vegetal", "sugg_proteina_ervilha"],
    },
  };

  // Verificar se existem substituições para este alimento nesta dieta
  if (dietSubstitutes[dietType] && dietSubstitutes[dietType][originalFoodId]) {
    return dietSubstitutes[dietType][originalFoodId];
  }

  // Se não existir substituição específica, retornar array vazio
  return [];
}
