import axios from 'axios';
import { AIProductIdentification, AIAlternative, Product } from '@/types';

// Free Google Gemini API configuration - Get your key from https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyARDQqqBL4zU1tE_ixrjluuK2sxlk6urL4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Rate limiting to respect free tier limits (60 requests/minute)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export const AIProductSearchService = {
  // Identify product from image using AI
  async identifyProductFromImage(imageUri: string): Promise<AIProductIdentification | null> {
    try {
      // Rate limiting - respect free tier limits
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();

      // Validate API key
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your environment variables.');
      }

      // Convert image to base64
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
        
        Be specific with product names and brands. Focus on food and consumer products.
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
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const identification = JSON.parse(cleanResponse);

      if (identification.confidence < 0.5) {
        return null;
      }

      return identification;
    } catch (error) {
      console.error('Error identifying product from image:', error);
      
      // Handle specific API errors
      if (error.response?.status === 400) {
        console.error('Invalid API request. Check your API key and request format.');
      } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded. Please wait before making another request.');
      } else if (error.response?.status === 403) {
        console.error('API key invalid or insufficient permissions.');
      }
      
      return null;
    }
  },

  // Get cheaper alternatives using AI
  async getCheaperAlternatives(product: Product): Promise<AIAlternative[]> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();

      // Validate API key
      if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured. Using fallback alternatives.');
        return this.getFallbackAlternatives(product);
      }

      const prompt = `
        Find 3-5 cheaper alternatives for this product: "${product.name}" by ${product.brand || 'Unknown Brand'} in category "${product.category || 'General'}".
        
        Return ONLY a JSON array with this exact structure:
        [
          {
            "name": "Alternative Product Name",
            "brand": "Brand Name",
            "category": "${product.category || 'General'}",
            "estimated_price": "$2.99",
            "original_price": "$4.99",
            "savings_percentage": 40,
            "reason": "Why this is a better choice (price, quality, health)",
            "key_features": ["feature1", "feature2", "feature3"],
            "where_to_find": "Walmart, Target, Amazon",
            "confidence": 0.85,
            "alternative_type": "budget"
          }
        ]
        
        Alternative types: "budget" (cheaper), "healthier" (better nutrition), "eco_friendly" (sustainable)
        Focus on real products that are commonly available in US stores.
        Ensure savings_percentage is realistic (10-60%).
        Make prices realistic for the product category.
      `;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const alternatives = JSON.parse(cleanResponse);

      // Validate and filter alternatives
      const validAlternatives = alternatives.filter((alt: any) => 
        alt.name && alt.estimated_price && alt.confidence > 0.5
      );

      return validAlternatives.length > 0 ? validAlternatives : this.getFallbackAlternatives(product);
    } catch (error) {
      console.error('Error getting AI alternatives:', error);
      return this.getFallbackAlternatives(product);
    }
  },

  // Fallback alternatives when AI is not available
  getFallbackAlternatives(product: Product): AIAlternative[] {
    const category = product.category?.toLowerCase() || 'general';
    const basePrice = this.estimateProductPrice(product);
    
    const alternatives: AIAlternative[] = [];
    
    // Budget alternative
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

    // Healthier alternative (if food category)
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

    // Eco-friendly alternative
    alternatives.push({
      name: `Eco-Friendly ${product.name}`,
      brand: 'Green Brand',
      category: product.category || 'General',
      estimated_price: `$${(basePrice * 0.85).toFixed(2)}`,
      original_price: `$${basePrice.toFixed(2)}`,
      savings_percentage: 15,
      reason: 'Sustainable packaging and environmentally friendly production',
      key_features: ['Eco-Friendly', 'Sustainable', 'Recyclable Packaging'],
      where_to_find: 'Target, Amazon, Local Stores',
      confidence: 0.72,
      alternative_type: 'eco_friendly'
    });

    return alternatives;
  },

  // Estimate product price based on category
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
    
    return 4.99; // Default price
  },

  // Convert image URI to base64
  async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
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
  },
};