import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/services/firestore';
import { UserFavorite } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const userFavorites = await FirestoreService.getFavorites(user.uid);
      setFavorites(userFavorites);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load favorites',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      await FirestoreService.removeFavorite(favoriteId);
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Product removed from favorites',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove favorite',
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

  if (loading) {
    return (
      <LinearGradient colors={['#f093fb', '#f5576c']} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-lg">Loading favorites...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f093fb', '#f5576c']} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="items-center pt-5 px-5 pb-5">
          <Heart size={32} color="white" fill="white" />
          <Text className="text-3xl font-bold text-white mt-3 mb-1">My Favorites</Text>
          <Text className="text-base text-white/90">
            {favorites.length} saved {favorites.length === 1 ? 'product' : 'products'}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View className="flex-1 justify-center items-center px-10 gap-4">
            <Heart size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text className="text-2xl font-bold text-white">No favorites yet</Text>
            <Text className="text-base text-white/80 text-center leading-6">
              Start scanning products to add them to your favorites!
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <View className="p-5 gap-4">
              {favorites.map((favorite) => (
                <View key={favorite.id} className="bg-white rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-3">
                    {favorite.product.imageUrl && (
                      <Image
                        source={{ uri: favorite.product.imageUrl }}
                        className="w-15 h-15 rounded-lg bg-gray-100"
                      />
                    )}
                    
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {favorite.product.name}
                      </Text>
                      {favorite.product.brand && (
                        <Text className="text-sm text-gray-600">
                          {favorite.product.brand}
                        </Text>
                      )}
                      {favorite.product.category && (
                        <Text className="text-xs text-gray-500">
                          {favorite.product.category}
                        </Text>
                      )}
                      
                      <View className="flex-row items-center gap-2 mt-1">
                        {favorite.product.nutritionGrade && (
                          <View 
                            className="w-5 h-5 rounded-full items-center justify-center"
                            style={{ backgroundColor: getNutritionGradeColor(favorite.product.nutritionGrade) }}
                          >
                            <Text className="text-white text-xs font-bold">
                              {favorite.product.nutritionGrade.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text className="text-xs text-gray-500">
                          Added {favorite.addedAt.toDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="p-2"
                    onPress={() => removeFavorite(favorite.id)}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}