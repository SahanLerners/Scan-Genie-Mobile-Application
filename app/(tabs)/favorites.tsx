import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
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
      <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.flex1}>
        <SafeAreaView style={styles.flex1}>
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.flex1}>
      <SafeAreaView style={styles.flex1}>
        <View style={styles.header}>
          <Heart size={32} color="white" fill="white" />
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length} saved {favorites.length === 1 ? 'product' : 'products'}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Start scanning products to add them to your favorites!
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.flex1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <View style={styles.list}>
              {favorites.map((favorite) => (
                <View key={favorite.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    {favorite.product.imageUrl && (
                      <Image
                        source={{ uri: favorite.product.imageUrl }}
                        style={styles.productImage}
                      />
                    )}

                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {favorite.product.name}
                      </Text>
                      {favorite.product.brand && (
                        <Text style={styles.productBrand}>
                          {favorite.product.brand}
                        </Text>
                      )}
                      {favorite.product.category && (
                        <Text style={styles.productCategory}>
                          {favorite.product.category}
                        </Text>
                      )}

                      <View style={styles.nutritionRow}>
                        {favorite.product.nutritionGrade && (
                          <View
                            style={[
                              styles.nutritionBadge,
                              { backgroundColor: getNutritionGradeColor(favorite.product.nutritionGrade) },
                            ]}
                          >
                            <Text style={styles.nutritionText}>
                              {favorite.product.nutritionGrade.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.addedAt}>
                          Added {favorite.addedAt.toDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
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

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ffffff', fontSize: 18 },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  list: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productInfo: { flex: 1, gap: 4 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  productBrand: { fontSize: 14, color: '#4b5563' },
  productCategory: { fontSize: 12, color: '#6b7280' },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  nutritionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  addedAt: { fontSize: 12, color: '#6b7280' },
  removeButton: { padding: 8 },
});
