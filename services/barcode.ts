import axios from "axios";

const api = axios.create({
  baseURL: "https://world.openfoodfacts.org/api/v0",
});

export interface ProductInfo {
  code: string;
  status: number;
  product: {
    product_name: string;
    product_name_pt?: string;
    nutriments: {
      "energy-kcal_100g": number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
    };
    serving_size?: string;
    serving_quantity?: number;
  };
}

export async function getProductByBarcode(
  barcode: string
): Promise<ProductInfo> {
  try {
    const response = await api.get(`/product/${barcode}.json`);

    if (response.data.status === 0) {
      throw new Error("Produto não encontrado");
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}
