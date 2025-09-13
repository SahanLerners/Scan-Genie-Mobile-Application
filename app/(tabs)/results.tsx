import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/services/firestore';
import { Product } from '@/types';
import { Heart, ArrowRight, Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function Results() {
  const { productData, aiIdentified, originalImage } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (productData) {
      try {
        const parsed = JSON.parse(productData as string);
        setProduct(parsed);
      } catch (error) {
        console.error('Error parsing product data:', error);
      }
    }
  }, [productData]);

  const toggleFavorite = async () => {
    if (!product || !user) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (isFavorite) {
        Toast.show({
          type: 'info',
          text1: 'Removed from favorites',
          text2: product.name,
        });
        setIsFavorite(false);
      } else {
        await FirestoreService.addFavorite(user.uid, product);
        Toast.show({
          type: 'success',
          text1: 'Added to favorites',
          text2: product.name,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update favorites',
      });
    }
  };

  const getNutritionGradeColor = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a': return '#22c55e';
      case 'b': return '#84cc16';
      case 'c': return '#eab308';
      case 'd': return '#f97316';
      case 'e': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getNutritionGradeIcon = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a':
      case 'b':
        return CheckCircle;
      case 'c':
        return Info;
      case 'd':
      case 'e':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  if (!product) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-lg">No product data available</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const GradeIcon = getNutritionGradeIcon(product.nutritionGrade);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-5 gap-4">
            <View className="bg-white rounded-2xl overflow-hidden">
              {(originalImage || product.imageUrl) && (
                <View className="relative">
                  <Image 
                    source={{ uri: originalImage as string || product.imageUrl }} 
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  {aiIdentified === 'true' && (
                    <View className="absolute top-3 right-3 bg-blue-600/90 flex-row items-center px-2 py-1 rounded-xl gap-1">
                      <Sparkles size={16} color="white" />
                      <Text className="text-white text-xs font-semibold">AI Identified</Text>
                    </View>
                  )}
                </View>
              )}
              
              <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-xl font-bold text-gray-900 mb-1">{product.name}</Text>
                    {product.brand && (
                      <Text className="text-base text-gray-600">{product.brand}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    className="p-2"
                    onPress={toggleFavorite}
                  >
                    <Heart
                      size={24}
                      color={isFavorite ? '#ef4444' : '#6b7280'}
                      fill={isFavorite ? '#ef4444' : 'none'}
                    />
                  </TouchableOpacity>
                </View>

                {product.category && (
                  <View className="self-start bg-gray-100 px-3 py-1 rounded-xl">
                    <Text className="text-xs text-gray-600 font-medium">{product.category}</Text>
                  </View>
                )}
              </View>
            </View>

            {product.nutritionGrade && (
              <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <GradeIcon 
                    size={24} 
                    color={getNutritionGradeColor(product.nutritionGrade)} 
                  />
                  <Text className="text-lg font-semibold text-gray-900">Nutrition Score</Text>
                </View>
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: getNutritionGradeColor(product.nutritionGrade) }}
                >
                  <Text className="text-white text-lg font-bold">
                    {product.nutritionGrade.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            {product.nutritionFacts && (
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Nutrition Facts (per 100g)</Text>
                <View className="gap-2">
                  {Object.entries(product.nutritionFacts).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <View key={key} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                        <Text className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {typeof value === 'number' ? `${value.toFixed(1)}g` : value}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Ingredients</Text>
                <Text className="text-sm text-gray-700 leading-5">
                  {product.ingredients.join(', ')}
                </Text>
              </View>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <View className="bg-white rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <AlertTriangle size={20} color="#ef4444" />
                  <Text className="text-lg font-semibold text-gray-900">Allergens</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {product.allergens.map((allergen, index) => (
                    <View key={index} className="bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                      <Text className="text-xs text-red-600 font-medium">{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              className="bg-white/20 border border-white/30 rounded-xl p-4 flex-row items-center justify-center gap-2"
              onPress={() => router.push({
                pathname: '/(tabs)/suggestions',
                params: { 
                  productData: JSON.stringify(product),
                  aiIdentified: aiIdentified || 'false'
                }
              })}
            >
              <Text className="text-white text-base font-semibold">
                {aiIdentified === 'true' ? 'Find Cheaper AI Alternatives' : 'View Healthier Alternatives'}
              </Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}