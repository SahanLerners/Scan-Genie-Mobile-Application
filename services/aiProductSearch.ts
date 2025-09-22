import axios from 'axios';
import Constants from 'expo-constants';
import { AIProductIdentification, AIAlternative, Product } from '@/types';
import 'react-native-url-polyfill/auto';

// Free Google Gemini API configuration (your config uses env or Constants)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || 'AIzaSyARDQqqBL4zU1tE_ixrjluuK2sxlk6urL4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

export const AIProductSearchService = {
  async identifyProductFromImage(imageUri: string): Promise<AIProductIdentification | null> {
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();

      if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured.');
        return null;
      }

      const base64Image = await this.convertImageToBase64(imageUri);

      const prompt = `
        Analyze this product image and identify the product. Return ONLY a JSON object with this exact structure:
        {
          "product_name": "exact product name",
          "brand": "brand name if visible",
          "category": "food category (e.g., snacks, beverages, dairy, etc.)",
          "confidence": 0.95,
          "description": "brief product description",
          "estimated_price_range": "$2.99 - $4.99",
          "key_features": ["feature1", "feature2", "feature3"]
        }
        If you cannot clearly identify the product, return:
        {
          "product_name": null,
          "confidence": 0.0,
          "error": "Could not identify product from image"
        }
      `;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) return null;

      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/\n?```/g, '')
        .replace(/```/g, '')
        .trim();

      try {
        const identification = JSON.parse(cleanResponse);
        if (typeof identification?.confidence === 'number' && identification.confidence >= 0.0) {
          return identification;
        }
        return null;
      } catch (e) {
        console.error('Failed to parse AI response JSON', e, cleanResponse);
        return null;
      }
    } catch (error) {
      console.error('Error identifying product from image:', error);
      return null;
    }
  },

  async getCheaperAlternatives(product: Product): Promise<AIAlternative[]> {
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();

      if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured. Using fallback.');
        return this.getFallbackAlternatives(product);
      }

      const prompt = `
        Find 3-5 cheaper alternatives for this product: "${product.name}" by ${product.brand || 'Unknown Brand'} in category "${product.category || 'General'}".
        Return ONLY a JSON array with objects like:
        [
          {
            "name":"Alternative Product",
            "brand":"Brand",
            "category":"${product.category || 'General'}",
            "estimated_price":"$2.99",
            "original_price":"$4.99",
            "savings_percentage":40,
            "reason":"why",
            "key_features":["f1","f2"],
            "where_to_find":"Walmart, Amazon",
            "confidence":0.85,
            "alternative_type":"budget"
          }
        ]
      `;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) throw new Error('No AI response');

      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      let alternatives;
      try {
        alternatives = JSON.parse(cleanResponse);
      } catch (e) {
        console.error('Failed to parse AI alternatives JSON', e, cleanResponse);
        return this.getFallbackAlternatives(product);
      }

      const validAlternatives = Array.isArray(alternatives)
        ? alternatives.filter((alt: any) => alt.name && alt.estimated_price)
        : [];

      return validAlternatives.length ? validAlternatives : this.getFallbackAlternatives(product);
    } catch (error) {
      console.error('Error getting AI alternatives:', error);
      return this.getFallbackAlternatives(product);
    }
  },

  getFallbackAlternatives(product: Product): AIAlternative[] {
    const category = product.category?.toLowerCase() || 'general';
    const basePrice = this.estimateProductPrice(product);

    const alternatives: AIAlternative[] = [];

    alternatives.push({
      name: `Store Brand ${product.name.replace(product.brand || '', '').trim()}`,
      brand: 'Generic Brand',
      category: product.category || 'General',
      estimated_price: `$${(basePrice * 0.7).toFixed(2)}`,
      original_price: `$${basePrice.toFixed(2)}`,
      savings_percentage: 30,
      reason: 'Same quality ingredients at a lower price point',
      key_features: ['Same Quality', 'Lower Cost', 'Widely Available'],
      where_to_find: 'Walmart, Kroger, Safeway',
      confidence: 0.85,
      alternative_type: 'budget'
    });

    if (category.includes('food') || category.includes('snack') || category.includes('dairy')) {
      alternatives.push({
        name: `Organic ${product.name}`,
        brand: 'Organic Brand',
        category: product.category || 'General',
        estimated_price: `$${(basePrice * 0.9).toFixed(2)}`,
        original_price: `$${(basePrice * 1.2).toFixed(2)}`,
        savings_percentage: 25,
        reason: 'Organic ingredients with better nutritional profile',
        key_features: ['Organic', 'No Preservatives', 'Better Nutrition'],
        where_to_find: 'Whole Foods, Target, Amazon',
        confidence: 0.78,
        alternative_type: 'healthier'
      });
    }

    alternatives.push({
      name: `Eco-Friendly ${product.name}`,
      brand: 'Green Brand',
      category: product.category || 'General',
      estimated_price: `$${(basePrice * 0.85).toFixed(2)}`,
      original_price: `$${basePrice.toFixed(2)}`,
      savings_percentage: 15,
      reason: 'Sustainable packaging',
      key_features: ['Eco-Friendly', 'Sustainable', 'Recyclable Packaging'],
      where_to_find: 'Target, Amazon, Local Stores',
      confidence: 0.72,
      alternative_type: 'eco_friendly'
    });

    return alternatives;
  },

  estimateProductPrice(product: Product): number {
    const category = product.category?.toLowerCase() || 'general';
    if (category.includes('snack')) return 3.99;
    if (category.includes('beverage') || category.includes('drink')) return 2.49;
    if (category.includes('dairy')) return 4.99;
    if (category.includes('bread') || category.includes('bakery')) return 3.49;
    if (category.includes('meat')) return 8.99;
    if (category.includes('frozen')) return 5.99;
    if (category.includes('cereal')) return 4.49;
    if (category.includes('sauce') || category.includes('condiment')) return 2.99;
    return 4.99;
  },

  async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }
};
