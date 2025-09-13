import axios from 'axios';
import { Product } from '@/types';

const BASE_URL = 'https://world.openfoodfacts.org/api/v0';

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  nutrition_grades?: string;
  ingredients_text?: string;
  allergens?: string;
  nutriments?: {
    energy_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
  };
}

export const OpenFoodFactsService = {
  // New: Search products by name and category (for AI-identified products)
  async searchProductsByName(productName: string, category?: string): Promise<Product[]> {
    try {
      const searchQuery = category ? `${productName} ${category}` : productName;
      const response = await axios.get(`${BASE_URL}/cgi/search.pl`, {
        params: {
          search_terms: searchQuery,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 10,
        }
      });

      if (!response.data.products || response.data.products.length === 0) {
        return [];
      }

      return response.data.products.map((apiProduct: OpenFoodFactsProduct) => ({
        id: apiProduct.code,
        barcode: apiProduct.code,
        name: apiProduct.product_name || 'Unknown Product',
        brand: apiProduct.brands?.split(',')[0]?.trim(),
        category: apiProduct.categories?.split(',')[0]?.trim(),
        imageUrl: apiProduct.image_url,
        nutritionGrade: apiProduct.nutrition_grades,
        ingredients: apiProduct.ingredients_text?.split(',').map(i => i.trim()),
        allergens: apiProduct.allergens?.split(',').map(a => a.trim()),
        nutritionFacts: apiProduct.nutriments ? {
          energy: apiProduct.nutriments.energy_100g,
          fat: apiProduct.nutriments.fat_100g,
          saturatedFat: apiProduct.nutriments['saturated-fat_100g'],
          carbohydrates: apiProduct.nutriments.carbohydrates_100g,
          sugars: apiProduct.nutriments.sugars_100g,
          fiber: apiProduct.nutriments.fiber_100g,
          proteins: apiProduct.nutriments.proteins_100g,
          salt: apiProduct.nutriments.salt_100g,
        } : undefined,
        scannedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await axios.get(`${BASE_URL}/product/${barcode}.json`);
      
      if (response.data.status === 0) {
        return null;
      }

      const apiProduct: OpenFoodFactsProduct = response.data.product;
      
      const product: Product = {
        id: apiProduct.code,
        barcode: apiProduct.code,
        name: apiProduct.product_name || 'Unknown Product',
        brand: apiProduct.brands?.split(',')[0]?.trim(),
        category: apiProduct.categories?.split(',')[0]?.trim(),
        imageUrl: apiProduct.image_url,
        nutritionGrade: apiProduct.nutrition_grades,
        ingredients: apiProduct.ingredients_text?.split(',').map(i => i.trim()),
        allergens: apiProduct.allergens?.split(',').map(a => a.trim()),
        nutritionFacts: apiProduct.nutriments ? {
          energy: apiProduct.nutriments.energy_100g,
          fat: apiProduct.nutriments.fat_100g,
          saturatedFat: apiProduct.nutriments['saturated-fat_100g'],
          carbohydrates: apiProduct.nutriments.carbohydrates_100g,
          sugars: apiProduct.nutriments.sugars_100g,
          fiber: apiProduct.nutriments.fiber_100g,
          proteins: apiProduct.nutriments.proteins_100g,
          salt: apiProduct.nutriments.salt_100g,
        } : undefined,
        scannedAt: new Date(),
      };

      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },
};