export interface EdamamNutrients {
  ENERC_KCAL: number;
  PROCNT: number;
  FAT: number;
  CHOCDF: number;
  FIBTG: number;
}

export interface EdamamFood {
  foodId: string;
  label: string;
  nutrients: EdamamNutrients;
  category: string;
  categoryLabel: string;
  image: string;
}

export interface EdamamMeasure {
  uri: string;
  label: string;
  weight: number;
}

export interface ParsedFood {
  food: EdamamFood;
  measure: EdamamMeasure;
}

export interface FoodHint {
  food: EdamamFood;
  measures: EdamamMeasure[];
}

export interface NutrientInfo {
  label: string;
  quantity: number;
  unit: string;
}

export interface TotalNutrients {
  ENERC_KCAL: NutrientInfo;
  PROCNT: NutrientInfo;
  FAT: NutrientInfo;
  CHOCDF: NutrientInfo;
  FIBTG: NutrientInfo;
  FASAT: NutrientInfo;
  NA: NutrientInfo;
  K: NutrientInfo;
  [key: string]: NutrientInfo;
}

export interface EdamamResponse {
  text?: string;
  hints?: FoodHint[];
  uri?: string;
  calories?: number;
  totalWeight?: number;
  dietLabels?: string[];
  healthLabels?: string[];
  cautions?: string[];
  totalNutrients?: TotalNutrients;
  totalDaily?: {
    [key: string]: NutrientInfo;
  };
  ingredients?: Array<{
    parsed: Array<{
      quantity: number;
      measure: string;
      food: string;
      foodId: string;
      weight: number;
      retainedWeight: number;
      nutrients: {
        [key: string]: NutrientInfo;
      };
      measureURI: string;
      status: string;
    }>;
  }>;
}

// Tipo para o estado de loading da busca
export type SearchStatus = "idle" | "loading" | "success" | "error";
