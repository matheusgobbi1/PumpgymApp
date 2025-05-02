import { FoodData } from "../types/food";
import { combinedFoodDatabase } from "./foodDatabase";
import { FoodResponse, FoodItem, FoodServing } from "../types/food";
import i18n from "../i18n";

// Função para remover acentos de um texto
const removeAccents = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Pré-processar as categorias únicas para evitar recálculos
const _uniqueFoodCategories = (() => {
  const categories = combinedFoodDatabase.map(
    (food) => food.category || "Outros"
  );
  return [...new Set(categories)].sort();
})();

// Crie um índice para alimentos por categoria para acesso mais rápido
const _foodsByCategory = (() => {
  const foodIndex = new Map<string, FoodData[]>();

  // Inicializar com todas as categorias, mesmo que vazias
  _uniqueFoodCategories.forEach((category) => {
    foodIndex.set(category, []);
  });

  // Preencher o índice com os alimentos
  combinedFoodDatabase.forEach((food) => {
    const category = food.category || "Outros";
    const categoryFoods = foodIndex.get(category) || [];
    categoryFoods.push(food);
    foodIndex.set(category, categoryFoods);
  });

  return foodIndex;
})();

// Função otimizada para extrair todas as categorias únicas
export const getFoodCategories = (): string[] => {
  const currentLanguage = i18n.language; // Obter idioma atual

  if (currentLanguage === "en-US") {
    // Traduzir categorias usando o arquivo de tradução i18n
    return _uniqueFoodCategories.map((category) =>
      i18n.t(`foodCategories.${category}`, { defaultValue: category })
    );
  }

  // Retornar categorias originais para português e outros idiomas
  return _uniqueFoodCategories;
};

// Função otimizada para buscar alimentos por categoria
export const getFoodsByCategory = (category: string): FoodData[] => {
  if (!category) {
    return combinedFoodDatabase;
  }

  const currentLanguage = i18n.language;

  // Se o idioma for inglês e a categoria estiver em inglês, precisamos encontrar a categoria equivalente em português
  if (currentLanguage === "en-US") {
    // Criar um mapa invertido das traduções
    const invertedTranslations = new Map<string, string>();

    // Para cada categoria em português existente no sistema
    for (const ptCategory of _uniqueFoodCategories) {
      // Obter a tradução para inglês
      const enCategory = i18n.t(`foodCategories.${ptCategory}`, {
        defaultValue: ptCategory,
      });
      // Armazenar no mapa invertido
      invertedTranslations.set(enCategory, ptCategory);
    }

    // Verificar se a categoria em inglês tem um equivalente em português
    const portugueseCategory = invertedTranslations.get(category);

    if (portugueseCategory) {
      return _foodsByCategory.get(portugueseCategory) || [];
    }
  }

  return _foodsByCategory.get(category) || [];
};

// Função para converter FoodData para FoodItem
export const convertFoodDataToFoodItem = (food: FoodData): FoodItem => {
  // Priorizar food.name se existir, senão buscar tradução
  const foodName = food.name
    ? food.name
    : i18n.t(`foods.${food.id}`, {
        defaultValue: food.id, // Fallback para o ID se não houver nome nem tradução
      });

  // Criar servings a partir das measures
  const servings: FoodServing[] = food.measures.map((measure) => ({
    serving_id: measure.id,
    serving_description: measure.label,
    metric_serving_amount: measure.weight,
    metric_serving_unit: "g",
    calories: Math.round((food.nutrients.calories * measure.weight) / 100),
    protein:
      Math.round(((food.nutrients.protein * measure.weight) / 100) * 10) / 10,
    fat: Math.round(((food.nutrients.fat * measure.weight) / 100) * 10) / 10,
    carbohydrate:
      Math.round(((food.nutrients.carbs * measure.weight) / 100) * 10) / 10,
    fiber: food.nutrients.fiber
      ? Math.round(((food.nutrients.fiber * measure.weight) / 100) * 10) / 10
      : undefined,
  }));

  // Reordenar as porções para priorizar embalagens e unidades
  const reorderedServings = [...servings].sort((a, b) => {
    // Verificar se a porção é uma embalagem ou unidade
    const unitIdentifiers = [
      "unidade",
      "pacote",
      "embalagem",
      "pote",
      "garrafa",
      "lata",
      "copo",
      "fatia",
      "bife",
      "filé",
      "gomo",
      "cookies",
      "bolacha",
      "cookie",
      "pão",
      "dose",
      "pedaço",
      "item",
    ];

    const isUnitA = unitIdentifiers.some((term) =>
      a.serving_description.toLowerCase().includes(term)
    );

    const isUnitB = unitIdentifiers.some((term) =>
      b.serving_description.toLowerCase().includes(term)
    );

    // Se ambos são unidades ou nenhum é, manter a ordem original
    if (isUnitA === isUnitB) {
      // Se nenhum é unidade, priorizar porções diferentes de 100g
      if (!isUnitA) {
        const is100gA = a.serving_description.toLowerCase().includes("100g");
        const is100gB = b.serving_description.toLowerCase().includes("100g");

        if (is100gA && !is100gB) return 1;
        if (!is100gA && is100gB) return -1;
      }
      return 0;
    }

    // Priorizar porções baseadas em unidades
    return isUnitA ? -1 : 1;
  });

  return {
    food_id: food.id,
    food_name: foodName, // Usar o nome definido acima
    food_type: food.category
      ? i18n.t(`foodCategories.${food.category}`, {
          defaultValue: food.category,
        })
      : "Generic foods",
    food_url: "",
    brand_name: food.brandName,
    servings: reorderedServings,
  };
};

// Função para buscar alimentos no banco de dados local
export const searchFoodsMockup = (
  query: string,
  category?: string
): FoodResponse => {
  const databaseToSearch = category
    ? getFoodsByCategory(category)
    : combinedFoodDatabase;

  if (!query || query.trim() === "") {
    // Se não houver consulta, retornar todos os alimentos da categoria ou base de dados
    const items = databaseToSearch.map((food) =>
      convertFoodDataToFoodItem(food)
    );
    return { items };
  }

  const normalizedQuery = removeAccents(query.trim());
  const keywords = normalizedQuery
    .split(/\s+/)
    .filter((keyword) => keyword.length > 1);

  // Buscar alimentos que contenham todas as palavras-chave no nome original OU no nome traduzido
  let results = databaseToSearch.filter((food) => {
    let matched = false;

    // 1. Verificar no nome original (se existir)
    if (food.name) {
      const normalizedOriginalName = removeAccents(food.name);
      if (
        keywords.every((keyword) => normalizedOriginalName.includes(keyword))
      ) {
        matched = true;
      }
    }

    // 2. Se não deu match no original (ou se não tinha nome original), verificar na tradução
    if (!matched) {
      const translatedName = i18n.t(`foods.${food.id}`, { defaultValue: "" });
      if (translatedName) {
        const normalizedTranslatedName = removeAccents(translatedName);
        if (
          keywords.every((keyword) =>
            normalizedTranslatedName.includes(keyword)
          )
        ) {
          matched = true;
        }
      }
    }

    // 3. (Opcional, como fallback) Se ainda não deu match, verificar no ID
    // if (!matched) {
    //   const normalizedId = removeAccents(food.id);
    //   if (keywords.every((keyword) => normalizedId.includes(keyword))) {
    //      matched = true;
    //    }
    // }

    return matched;
  });

  // Converter para o formato FoodItem
  const items = results.map((food) => convertFoodDataToFoodItem(food));

  return { items };
};

// Função para obter detalhes de um alimento pelo ID
export const getFoodDetailsMockup = (foodId: string): FoodResponse => {
  // Buscar alimento pelo ID
  const food = combinedFoodDatabase.find((food) => food.id === foodId);

  if (!food) {
    return { items: [] };
  }

  // Converter para o formato FoodItem
  const foodItem = convertFoodDataToFoodItem(food);

  return { items: [foodItem] };
};
