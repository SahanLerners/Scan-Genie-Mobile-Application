import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Platform, StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/services/firestore';
import { Product } from '@/types';
import { Heart, ArrowRight, Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function Results() {
  const { productData, aiIdentified, originalImage } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const savedOnceRef = useRef(false);

  useEffect(() => {
    if (productData) {
      try {
        const parsed = JSON.parse(productData as string);
        const normalized: Product = {
          id: parsed.id ?? `local_${Date.now()}`,
          barcode: parsed.barcode ?? parsed.id ?? undefined,
          name: parsed.name ?? 'Unknown Product',
          brand: parsed.brand ?? undefined,
          category: parsed.category ?? 'Unknown',
          imageUrl: parsed.imageUrl ?? undefined,
          nutritionGrade: parsed.nutritionGrade ?? undefined,
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : (parsed.ingredients
              ? String(parsed.ingredients).split(',').map((s: string) => s.trim()).filter(Boolean)
              : []),
          allergens: Array.isArray(parsed.allergens)
            ? parsed.allergens
            : (parsed.allergens
              ? String(parsed.allergens).split(',').map((s: string) => s.trim()).filter(Boolean)
              : []),
          nutritionFacts: parsed.nutritionFacts ?? undefined,
          scannedAt: parsed.scannedAt ? new Date(parsed.scannedAt) : new Date(),
        };
        setProduct(normalized);
      } catch (error) {
        console.error('Error parsing product data:', error);
        Toast.show({ type: 'error', text1: 'Invalid product data', text2: 'Could not load product' });
      }
    }
  }, [productData]);

  // Save scan once
  useEffect(() => {
    const saveScan = async () => {
      if (!product || !user || savedOnceRef.current) return;
      try {
        await FirestoreService.addScanToHistory(user.uid, product);
        savedOnceRef.current = true;
      } catch (error) {
        console.error('Failed to save scan to firestore:', error);
      }
    };
    saveScan();
  }, [product, user]);

  const toggleFavorite = async () => {
    if (!product || !user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isFavorite) {
        Toast.show({ type: 'info', text1: 'Removed from favorites', text2: product.name });
        setIsFavorite(false);
      } else {
        await FirestoreService.addFavorite(user.uid, product);
        Toast.show({ type: 'success', text1: 'Added to favorites', text2: product.name });
        setIsFavorite(true);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update favorites' });
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
      case 'b': return CheckCircle;
      case 'c': return Info;
      case 'd':
      case 'e': return AlertTriangle;
      default: return Info;
    }
  };

  if (!product) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.flex1}>
        <SafeAreaView style={styles.flex1}>
          <View style={styles.centerContent}>
            <Text style={styles.whiteTextLg}>No product data available</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const GradeIcon = getNutritionGradeIcon(product.nutritionGrade);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.flex1}>
      <SafeAreaView style={styles.flex1}>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Product Card */}
            <View style={styles.card}>
              {(originalImage || product.imageUrl) && (
                <View style={styles.relative}>
                  <Image
                    source={{ uri: (originalImage as string) || product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  {aiIdentified === 'true' && (
                    <View style={styles.aiBadge}>
                      <Sparkles size={16} color="white" />
                      <Text style={styles.aiBadgeText}>AI Identified</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.padded}>
                <View style={styles.cardHeader}>
                  <View style={styles.flex1}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
                  </View>
                  <TouchableOpacity style={styles.touchableIcon} onPress={toggleFavorite}>
                    <Heart
                      size={24}
                      color={isFavorite ? '#ef4444' : '#6b7280'}
                      fill={isFavorite ? '#ef4444' : 'none'}
                    />
                  </TouchableOpacity>
                </View>
                {product.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Nutrition Score */}
            {product.nutritionGrade && (
              <View style={styles.nutritionCard}>
                <View style={styles.row}>
                  <GradeIcon size={24} color={getNutritionGradeColor(product.nutritionGrade)} />
                  <Text style={styles.nutritionTitle}>Nutrition Score</Text>
                </View>
                <View style={[styles.gradeCircle, { backgroundColor: getNutritionGradeColor(product.nutritionGrade) }]}>
                  <Text style={styles.gradeText}>{product.nutritionGrade.toUpperCase()}</Text>
                </View>
              </View>
            )}

            {/* Nutrition Facts */}
            {product.nutritionFacts && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Nutrition Facts (per 100g)</Text>
                {Object.entries(product.nutritionFacts).map(([key, value]) => {
                  if (value === null || value === undefined) return null;
                  return (
                    <View key={key} style={styles.factRow}>
                      <Text style={styles.factLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                      <Text style={styles.factValue}>
                        {typeof value === 'number' ? `${value.toFixed(1)}g` : String(value)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ingredients */}
            {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.ingredientsText}>{product.ingredients.join(', ')}</Text>
              </View>
            )}

            {/* Allergens */}
            {Array.isArray(product.allergens) && product.allergens.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.allergenHeader}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <Text style={styles.sectionTitle}>Allergens</Text>
                </View>
                <View style={styles.allergenList}>
                  {product.allergens.map((a, i) => (
                    <View key={i} style={styles.allergenBadge}>
                      <Text style={styles.allergenText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Alternatives Button */}
            <TouchableOpacity
              style={styles.altButton}
              onPress={() => router.push({
                pathname: '/(tabs)/suggestions',
                params: { productData: JSON.stringify(product), aiIdentified: aiIdentified || 'false' }
              })}
            >
              <Text style={styles.altButtonText}>
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

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  whiteTextLg: { color: '#fff', fontSize: 18 },
  container: { padding: 20, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  relative: { position: 'relative' },
  productImage: { width: '100%', height: 192 },
  aiBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, gap: 4
  },
  aiBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  padded: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  productTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  productBrand: { fontSize: 16, color: '#4b5563' },
  flex1Item: { flex: 1 },
  touchableIcon: { padding: 8 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  nutritionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nutritionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  gradeCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  gradeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  factLabel: { fontSize: 14, color: '#4b5563', textTransform: 'capitalize' },
  factValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  ingredientsText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  allergenHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  allergenList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenBadge: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  allergenText: { fontSize: 12, color: '#dc2626', fontWeight: '500' },
  altButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  altButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
