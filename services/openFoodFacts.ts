import axios from 'axios';
import { Product } from '@/types';

const BASE_URL = 'https://world.openfoodfacts.org';

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
  // Search products by name (AI identified name or direct query)
  async searchProductsByName(productName: string, category?: string): Promise<Product[]> {
    try {
      const cleanProductName = String(productName || '').toLowerCase().trim();

      const isFruitOrVeg = !!(
        category?.toLowerCase().includes('fruit') ||
        category?.toLowerCase().includes('vegetable') ||
        ['banana', 'apple', 'orange', 'tomato', 'carrot'].some(item =>
          cleanProductName.includes(item)
        )
      );

      const searchQuery = isFruitOrVeg ? cleanProductName :
        (category ? `${cleanProductName} ${category}` : cleanProductName);

      const response = await axios.get(`${BASE_URL}/cgi/search.pl`, {
        params: {
          search_terms: searchQuery,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 20,
          fields: 'code,product_name,brands,categories,image_url,nutrition_grades,ingredients_text,allergens,nutriments'
        },
        timeout: 15000
      });

      // Defensive: ensure shape
      const products = Array.isArray(response.data?.products) ? response.data.products : [];

      if (products.length === 0) {
        // Broader fallback search
        const broaderResponse = await axios.get(`${BASE_URL}/cgi/search.pl`, {
          params: {
            search_terms: cleanProductName.split(' ')[0] || cleanProductName,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: 10,
            fields: 'code,product_name,brands,categories,image_url,nutrition_grades,ingredients_text,allergens,nutriments'
          },
          timeout: 10000
        });

        const broader = Array.isArray(broaderResponse.data?.products) ? broaderResponse.data.products : [];
        return broader.slice(0, 3).map(toProductMapper(productName, category));
      }

      return products.map(toProductMapper(productName, category));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await axios.get(`${BASE_URL}/product/${barcode}.json`, { timeout: 10000 });

      if (response.data?.status === 0) {
        return null;
      }

      const apiProduct: OpenFoodFactsProduct = response.data.product;
      return toProductMapper(undefined, undefined)(apiProduct);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      return null;
    }
  },
};

// Helper: returns mapper function for an API product into your Product type
function toProductMapper(fallbackName?: string, fallbackCategory?: string) {
  return (apiProduct: OpenFoodFactsProduct): Product => {
    const now = new Date();

    // safe parsing helpers
    const splitToArray = (val?: string) =>
      val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : [];

    const nutriments = apiProduct.nutriments || {};

    return {
      id: apiProduct.code || `search_${Date.now()}`,
      barcode: apiProduct.code || `search_${Date.now()}`,
      name: apiProduct.product_name || fallbackName || 'Unknown Product',
      brand: apiProduct.brands ? String(apiProduct.brands).split(',')[0].trim() : undefined,
      category: fallbackCategory || (apiProduct.categories ? String(apiProduct.categories).split(',')[0].trim() : 'Unknown'),
      imageUrl: apiProduct.image_url,
      nutritionGrade: apiProduct.nutrition_grades,
      ingredients: splitToArray(apiProduct.ingredients_text),
      allergens: splitToArray(apiProduct.allergens),
      nutritionFacts: {
        energy: nutriments.energy_100g ?? null,
        fat: nutriments.fat_100g ?? null,
        saturatedFat: nutriments['saturated-fat_100g'] ?? null,
        carbohydrates: nutriments.carbohydrates_100g ?? null,
        sugars: nutriments.sugars_100g ?? null,
        fiber: nutriments.fiber_100g ?? null,
        proteins: nutriments.proteins_100g ?? null,
        salt: nutriments.salt_100g ?? null,
      },
      scannedAt: now,
    };
  };
}
