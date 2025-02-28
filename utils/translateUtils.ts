// Dicionário simples de tradução português -> inglês
const ptToEnDictionary: { [key: string]: string } = {
  frango: "chicken",
  arroz: "rice",
  feijao: "beans",
  carne: "meat",
  peixe: "fish",
  ovo: "egg",
  leite: "milk",
  pao: "bread",
  queijo: "cheese",
  iogurte: "yogurt",
  banana: "banana",
  maca: "apple",
  laranja: "orange",
  batata: "potato",
  cenoura: "carrot",
  alface: "lettuce",
  tomate: "tomato",
  cebola: "onion",
  alho: "garlic",
  azeite: "olive oil",
  manteiga: "butter",
  agua: "water",
  cafe: "coffee",
  cha: "tea",
  suco: "juice",
  cerveja: "beer",
  vinho: "wine",
  sal: "salt",
  acucar: "sugar",
  chocolate: "chocolate",
  sorvete: "ice cream",
  bolo: "cake",
  biscoito: "cookie",
  macarrao: "pasta",
  pizza: "pizza",
  salada: "salad",
  sopa: "soup",
  "carne moida": "ground beef",
  "peito de frango": "chicken breast",
  "file de peixe": "fish fillet",
  presunto: "ham",
  mortadela: "mortadella",
  salsicha: "sausage",
  bacon: "bacon",
  atum: "tuna",
  sardinha: "sardine",
  camarao: "shrimp",
  amendoim: "peanut",
  castanha: "cashew",
  nozes: "walnut",
  aveia: "oatmeal",
  granola: "granola",
  mel: "honey",
  geleia: "jelly",
  snickers: "snickers",
  barra: "bar",
  pacote: "package",
  unidade: "unit",
  fatia: "slice",
  pedaço: "piece",
  copo: "cup",
  colher: "spoon",
  prato: "plate",
  porção: "serving",
};

// Dicionário inglês -> português (invertido)
const enToPtDictionary: { [key: string]: string } = Object.entries(
  ptToEnDictionary
).reduce((acc, [pt, en]) => ({ ...acc, [en.toLowerCase()]: pt }), {});

// Dicionário de tradução para medidas
const measureTranslations: { [key: string]: string } = {
  serving: "porção",
  gram: "grama",
  ounce: "onça",
  pound: "libra",
  kilogram: "quilograma",
  cup: "xícara",
  tablespoon: "colher de sopa",
  teaspoon: "colher de chá",
  slice: "fatia",
  piece: "unidade",
  package: "pacote",
  container: "recipiente",
  bottle: "garrafa",
  can: "lata",
  unit: "unidade",
  whole: "inteiro",
  milliliter: "mililitro",
  liter: "litro",
  "fluid ounce": "onça líquida",
  pint: "pint",
  quart: "quart",
  gallon: "galão",
  handful: "punhado",
  pinch: "pitada",
  dash: "dash",
  packet: "sachê",
  bar: "barra",
  box: "caixa",
  bag: "pacote",
  scoop: "colher",
  portion: "porção",
  medium: "médio",
  large: "grande",
  small: "pequeno",
  "extra large": "extra grande",
};

// Função para remover acentos
function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function translateFoodSearch(query: string): Promise<string> {
  try {
    // Normaliza a query (remove acentos e converte para minúsculas)
    const normalizedQuery = removeAccents(query.toLowerCase());

    // Procura no dicionário
    return ptToEnDictionary[normalizedQuery] || query;
  } catch (error) {
    console.error("Erro na tradução:", error);
    return query;
  }
}

export async function translateFoodResult(text: string): Promise<string> {
  try {
    // Normaliza o texto e procura no dicionário invertido
    const normalizedText = text.toLowerCase();
    return enToPtDictionary[normalizedText] || text;
  } catch (error) {
    console.error("Erro na tradução:", error);
    return text;
  }
}

export function translateMeasure(measure: string): string {
  try {
    const lowerMeasure = measure.toLowerCase();

    // Primeiro tenta encontrar a tradução exata
    if (measureTranslations[lowerMeasure]) {
      return measureTranslations[lowerMeasure];
    }

    // Se não encontrar, procura por palavras parciais
    for (const [en, pt] of Object.entries(measureTranslations)) {
      if (lowerMeasure.includes(en.toLowerCase())) {
        return pt;
      }
    }

    // Se não encontrar nenhuma tradução, retorna a medida original
    return measure;
  } catch (error) {
    console.error("Erro na tradução da medida:", error);
    return measure;
  }
}

// Função para formatar a medida em português
export function formatMeasure(quantity: number, measure: string): string {
  const translatedMeasure = translateMeasure(measure);

  // Formata o número com no máximo 1 casa decimal
  const formattedQuantity = Math.round(quantity * 10) / 10;

  // Casos especiais de pluralização
  if (translatedMeasure === "grama") {
    return `${formattedQuantity}g`;
  }

  if (translatedMeasure === "unidade" && formattedQuantity > 1) {
    return `${formattedQuantity} unidades`;
  }

  if (translatedMeasure === "porção" && formattedQuantity > 1) {
    return `${formattedQuantity} porções`;
  }

  return `${formattedQuantity} ${translatedMeasure}`;
}
