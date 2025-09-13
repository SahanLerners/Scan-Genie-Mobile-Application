import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Image 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AIProductSearchService } from '@/services/aiProductSearch';
import { Product, AIAlternative } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Lightbulb, 
  TrendingDown, 
  Leaf, 
  Shield, 
  DollarSign,
  Star,
  MapPin,
  Sparkles
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function Suggestions() {
  const { productData, aiIdentified } = useLocalSearchParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<AIAlternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (productData) {
      try {
        const parsed = JSON.parse(productData as string);
        setProduct(parsed);
        loadAlternatives(parsed);
      } catch (error) {
        console.error('Error parsing product data:', error);
      }
    } else {
      // Load default suggestions if no specific product
      loadDefaultSuggestions();
    }
  }, [productData]);

  const loadAlternatives = async (productToAnalyze: Product) => {
    setLoading(true);
    try {
      const aiAlternatives = await AIProductSearchService.getCheaperAlternatives(productToAnalyze);
      setAlternatives(aiAlternatives);
      
      if (aiAlternatives.length > 0) {
        Toast.show({
          type: 'success',
          text1: 'Alternatives Found!',
          text2: `Found ${aiAlternatives.length} cheaper options`,
        });
      }
    } catch (error) {
      console.error('Error loading alternatives:', error);
      // Load fallback alternatives
      setAlternatives(getFallbackAlternatives(productToAnalyze));
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultSuggestions = () => {
    const defaultSuggestions: AIAlternative[] = [
      {
        name: 'Organic Whole Grain Bread',
        brand: 'Nature Valley',
        category: 'Bakery',
        estimated_price: '$3.49',
        original_price: '$4.99',
        savings_percentage: 30,
        reason: 'Higher fiber content and no preservatives',
        key_features: ['Organic', 'Whole Grain', 'No Preservatives'],
        where_to_find: 'Walmart, Target',
        confidence: 0.85,
        alternative_type: 'healthier'
      },
      {
        name: 'Store Brand Greek Yogurt',
        brand: 'Great Value',
        category: 'Dairy',
        estimated_price: '$2.99',
        original_price: '$5.49',
        savings_percentage: 45,
        reason: 'Same nutritional value at lower cost',
        key_features: ['High Protein', 'Probiotics', 'Low Sugar'],
        where_to_find: 'Walmart',
        confidence: 0.92,
        alternative_type: 'budget'
      },
      {
        name: 'Eco-Friendly Cleaning Spray',
        brand: 'Seventh Generation',
        category: 'Household',
        estimated_price: '$4.29',
        original_price: '$6.99',
        savings_percentage: 39,
        reason: 'Plant-based ingredients, better for environment',
        key_features: ['Plant-Based', 'Biodegradable', 'Non-Toxic'],
        where_to_find: 'Target, Amazon',
        confidence: 0.78,
        alternative_type: 'eco_friendly'
      }
    ];
    setAlternatives(defaultSuggestions);
  };

  const getFallbackAlternatives = (product: Product): AIAlternative[] => {
    const category = product.category?.toLowerCase() || 'food';
    
    if (category.includes('snack') || category.includes('food')) {
      return [
        {
          name: `Organic ${product.name}`,
          brand: 'Store Brand',
          category: product.category || 'Food',
          estimated_price: '$2.99',
          original_price: '$4.49',
          savings_percentage: 33,
          reason: 'Organic alternative with better ingredients',
          key_features: ['Organic', 'No Additives', 'Better Quality'],
          where_to_find: 'Whole Foods, Target',
          confidence: 0.75,
          alternative_type: 'healthier'
        },
        {
          name: `Budget ${product.name}`,
          brand: 'Generic Brand',
          category: product.category || 'Food',
          estimated_price: '$1.99',
          original_price: '$4.49',
          savings_percentage: 56,
          reason: 'Same quality at lower price',
          key_features: ['Same Ingredients', 'Lower Cost', 'Good Value'],
          where_to_find: 'Walmart, Aldi',
          confidence: 0.88,
          alternative_type: 'budget'
        }
      ];
    }
    
    return [];
  };

  const handleRefresh = async () => {
    if (product) {
      setRefreshing(true);
      await loadAlternatives(product);
      setRefreshing(false);
    }
  };

  const getAlternativeIcon = (type: string) => {
    switch (type) {
      case 'budget': return DollarSign;
      case 'healthier': return Leaf;
      case 'eco_friendly': return Shield;
      default: return Star;
    }
  };

  const getAlternativeColor = (savingsPercentage: number) => {
    if (savingsPercentage >= 40) return '#22c55e'; // Green for high savings
    if (savingsPercentage >= 20) return '#3b82f6'; // Blue for moderate savings
    return '#8b5cf6'; // Purple for low savings
  };

  const getSavingsColor = (savingsPercentage: number) => {
    if (savingsPercentage >= 40) return 'text-green-600 bg-green-50 border-green-200';
    if (savingsPercentage >= 20) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-purple-600 bg-purple-50 border-purple-200';
  };

  return (
    <LinearGradient colors={['#43e97b', '#38f9d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="p-5">
            {/* Header */}
            <View className="items-center pt-4 pb-6">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                <Lightbulb size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-white mb-2">
                {product ? 'Cheaper Alternatives' : 'Smart Suggestions'}
              </Text>
              <Text className="text-base text-white/90 text-center leading-6">
                {product 
                  ? `AI-powered alternatives for ${product.name}`
                  : 'Discover better products and save money'
                }
              </Text>
              {aiIdentified === 'true' && (
                <BlurView className="mt-3 px-3 py-1 rounded-xl" intensity={20} tint="light">
                  <View className="flex-row items-center gap-2">
                    <Sparkles size={16} color="white" />
                    <Text className="text-white text-sm font-semibold">AI Powered</Text>
                  </View>
                </BlurView>
              )}
            </View>

            {/* Loading State */}
            {loading && (
              <BlurView className="rounded-2xl p-6 mb-4" intensity={20} tint="light">
                <Text className="text-white text-center font-semibold">
                  🤖 AI is finding cheaper alternatives...
                </Text>
              </BlurView>
            )}

            {/* Alternatives List */}
            <View className="gap-4">
              {alternatives.map((alternative, index) => {
                const IconComponent = getAlternativeIcon(alternative.alternative_type);
                const iconColor = getAlternativeColor(alternative.savings_percentage);
                const savingsColorClass = getSavingsColor(alternative.savings_percentage);
                
                return (
                  <TouchableOpacity key={index} className="bg-white rounded-2xl p-5 shadow-lg">
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: iconColor }}
                      >
                        <IconComponent size={24} color="white" />
                      </View>
                      <View className={`px-3 py-1 rounded-xl border ${savingsColorClass}`}>
                        <Text className="text-xs font-bold">
                          {alternative.savings_percentage}% OFF
                        </Text>
                      </View>
                    </View>

                    {/* Product Info */}
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {alternative.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">
                      {alternative.brand} • {alternative.category}
                    </Text>
                    
                    {/* Pricing */}
                    <View className="flex-row items-center gap-3 mb-3">
                      <Text className="text-xl font-bold text-green-600">
                        {alternative.estimated_price}
                      </Text>
                      {alternative.original_price && (
                        <Text className="text-sm text-gray-500 line-through">
                          {alternative.original_price}
                        </Text>
                      )}
                      <Text className="text-sm font-semibold text-green-600">
                        Save ${(parseFloat(alternative.original_price?.replace('$', '') || '0') - 
                               parseFloat(alternative.estimated_price.replace('$', ''))).toFixed(2)}
                      </Text>
                    </View>

                    {/* Reason */}
                    <Text className="text-sm text-gray-700 leading-5 mb-4">
                      {alternative.reason}
                    </Text>

                    {/* Features */}
                    <View className="flex-row flex-wrap gap-2 mb-4">
                      {alternative.key_features.map((feature, featureIndex) => (
                        <View key={featureIndex} className="bg-gray-100 px-2 py-1 rounded-lg">
                          <Text className="text-xs text-gray-600 font-medium">
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Where to Find */}
                    <View className="flex-row items-center gap-2 mb-4">
                      <MapPin size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-600">
                        Available at: {alternative.where_to_find}
                      </Text>
                    </View>

                    {/* Confidence */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-gray-500">AI Confidence:</Text>
                        <View className="flex-row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color={star <= alternative.confidence * 5 ? '#fbbf24' : '#d1d5db'}
                              fill={star <= alternative.confidence * 5 ? '#fbbf24' : 'none'}
                            />
                          ))}
                        </View>
                      </View>
                      
                      <TouchableOpacity className="bg-green-500 px-4 py-2 rounded-lg">
                        <Text className="text-white text-sm font-semibold">Find Store</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* No Alternatives Message */}
            {!loading && alternatives.length === 0 && (
              <BlurView className="rounded-2xl p-6 items-center" intensity={20} tint="light">
                <Lightbulb size={48} color="rgba(255, 255, 255, 0.7)" />
                <Text className="text-xl font-bold text-white mt-4 mb-2">
                  No Alternatives Found
                </Text>
                <Text className="text-white/80 text-center leading-6">
                  {product 
                    ? 'Try scanning another product or check back later for new suggestions'
                    : 'Start scanning products to get personalized suggestions'
                  }
                </Text>
              </BlurView>
            )}

            {/* Smart Shopping Tips */}
            <BlurView className="rounded-2xl p-5 mt-6" intensity={20} tint="light">
              <Text className="text-lg font-bold text-white mb-4">💡 Smart Shopping Tips</Text>
              <View className="gap-3">
                <View className="flex-row items-start gap-3">
                  <Text className="text-white text-lg">🏷️</Text>
                  <Text className="text-white/90 text-sm leading-5 flex-1">
                    Compare unit prices, not just package prices
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <Text className="text-white text-lg">🛒</Text>
                  <Text className="text-white/90 text-sm leading-5 flex-1">
                    Store brands often offer 20-40% savings
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <Text className="text-white text-lg">📱</Text>
                  <Text className="text-white/90 text-sm leading-5 flex-1">
                    Use this app to scan before buying anything
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <Text className="text-white text-lg">🌱</Text>
                  <Text className="text-white/90 text-sm leading-5 flex-1">
                    Organic doesn't always mean healthier - check nutrition facts
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}