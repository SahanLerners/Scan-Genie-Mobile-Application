import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { AIProductSearchService } from "@/services/aiProductSearch";
import { Product, AIAlternative } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Lightbulb,
  Leaf,
  Shield,
  DollarSign,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

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
        const normalized: Product = {
          id: parsed.id ?? `local_${Date.now()}`,
          barcode: parsed.barcode ?? parsed.id ?? undefined,
          name: parsed.name ?? "Unknown Product",
          brand: parsed.brand ?? undefined,
          category: parsed.category ?? "Unknown",
          imageUrl: parsed.imageUrl ?? undefined,
          nutritionGrade: parsed.nutritionGrade ?? undefined,
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : parsed.ingredients
            ? String(parsed.ingredients)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          allergens: Array.isArray(parsed.allergens)
            ? parsed.allergens
            : parsed.allergens
            ? String(parsed.allergens)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          nutritionFacts: parsed.nutritionFacts ?? undefined,
          scannedAt: parsed.scannedAt ? new Date(parsed.scannedAt) : new Date(),
        };
        setProduct(normalized);
        loadAlternatives(normalized);
      } catch (error) {
        console.error("Error parsing product data:", error);
        Toast.show({
          type: "error",
          text1: "Invalid product data",
          text2: "Could not load suggestions",
        });
      }
    } else {
      loadDefaultSuggestions();
    }
  }, [productData]);

  const loadAlternatives = async (productToAnalyze: Product) => {
    setLoading(true);
    try {
      if (!productToAnalyze) {
        setAlternatives([]);
        setLoading(false);
        return;
      }
      const aiAlternatives =
        await AIProductSearchService.getCheaperAlternatives(productToAnalyze);
      const normalized = (aiAlternatives || []).map((alt) => ({
        name: alt.name ?? "Unknown Alternative",
        brand: alt.brand ?? undefined,
        category: alt.category ?? productToAnalyze.category ?? "General",
        estimated_price: alt.estimated_price ?? "$0.00",
        original_price: alt.original_price ?? "$0.00",
        savings_percentage:
          typeof alt.savings_percentage === "number"
            ? alt.savings_percentage
            : 0,
        reason: alt.reason ?? "",
        key_features: Array.isArray(alt.key_features)
          ? alt.key_features
          : alt.key_features
          ? String(alt.key_features)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
        where_to_find: alt.where_to_find ?? "Online",
        confidence: typeof alt.confidence === "number" ? alt.confidence : 0,
        alternative_type: alt.alternative_type ?? "budget",
      })) as AIAlternative[];

      setAlternatives(normalized);

      if (normalized.length > 0) {
        Toast.show({
          type: "success",
          text1: "Alternatives Found!",
          text2: `Found ${normalized.length} options`,
        });
      } else {
        setAlternatives(getFallbackAlternatives(productToAnalyze));
      }
    } catch (error) {
      console.error("Error loading alternatives:", error);
      setAlternatives(getFallbackAlternatives(productToAnalyze));
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultSuggestions = () => {
    setAlternatives([
      {
        name: "Organic Whole Grain Bread",
        brand: "Nature Valley",
        category: "Bakery",
        estimated_price: "$3.49",
        original_price: "$4.99",
        savings_percentage: 30,
        reason: "Higher fiber content and no preservatives",
        key_features: ["Organic", "Whole Grain", "No Preservatives"],
        where_to_find: "Walmart, Target",
        confidence: 0.85,
        alternative_type: "healthier",
      },
      {
        name: "Store Brand Greek Yogurt",
        brand: "Great Value",
        category: "Dairy",
        estimated_price: "$2.99",
        original_price: "$5.49",
        savings_percentage: 45,
        reason: "Same nutritional value at lower cost",
        key_features: ["High Protein", "Probiotics", "Low Sugar"],
        where_to_find: "Walmart",
        confidence: 0.92,
        alternative_type: "budget",
      },
    ]);
  };

  const getFallbackAlternatives = (product: Product): AIAlternative[] => {
    const category = (product.category ?? "food").toLowerCase();
    if (category.includes("snack") || category.includes("food")) {
      return [
        {
          name: `Organic ${product.name}`,
          brand: "Store Brand",
          category: product.category ?? "Food",
          estimated_price: "$2.99",
          original_price: "$4.49",
          savings_percentage: 33,
          reason: "Organic alternative with better ingredients",
          key_features: ["Organic", "No Additives", "Better Quality"],
          where_to_find: "Whole Foods, Target",
          confidence: 0.75,
          alternative_type: "healthier",
        },
        {
          name: `Budget ${product.name}`,
          brand: "Generic Brand",
          category: product.category ?? "Food",
          estimated_price: "$1.99",
          original_price: "$4.49",
          savings_percentage: 56,
          reason: "Same quality at lower price",
          key_features: ["Same Ingredients", "Lower Cost", "Good Value"],
          where_to_find: "Walmart, Aldi",
          confidence: 0.88,
          alternative_type: "budget",
        },
      ];
    }
    return [];
  };

  const handleRefresh = async () => {
    if (!product) {
      loadDefaultSuggestions();
      return;
    }
    setRefreshing(true);
    await loadAlternatives(product);
    setRefreshing(false);
  };

  const getAlternativeIcon = (type: string) => {
    switch (type) {
      case "budget":
        return DollarSign;
      case "healthier":
        return Leaf;
      case "eco_friendly":
        return Shield;
      default:
        return Star;
    }
  };

  const getAlternativeColor = (savingsPercentage: number) => {
    if (savingsPercentage >= 40) return "#22c55e";
    if (savingsPercentage >= 20) return "#3b82f6";
    return "#8b5cf6";
  };

  return (
    <LinearGradient colors={["#43e97b", "#38f9d7"]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Lightbulb size={32} color="white" />
              </View>
              <Text style={styles.title}>
                {product ? "Cheaper Alternatives" : "Smart Suggestions"}
              </Text>
              <Text style={styles.subtitle}>
                {product
                  ? `AI-powered alternatives for ${product.name}`
                  : "Discover better products and save money"}
              </Text>
              {aiIdentified === "true" && (
                <BlurView intensity={20} tint="light" style={styles.aiBadge}>
                  <View style={styles.aiBadgeContent}>
                    <Sparkles size={16} color="white" />
                    <Text style={styles.aiBadgeText}>AI Powered</Text>
                  </View>
                </BlurView>
              )}
            </View>

            {/* Loading */}
            {loading && (
              <BlurView intensity={20} tint="light" style={styles.loadingBox}>
                <Text style={styles.loadingText}>
                  🤖 AI is finding cheaper alternatives...
                </Text>
              </BlurView>
            )}

            {/* Alternatives list */}
            <View style={styles.list}>
              {alternatives.map((alternative, index) => {
                const IconComponent = getAlternativeIcon(
                  alternative.alternative_type
                );
                const iconColor = getAlternativeColor(
                  alternative.savings_percentage
                );

                return (
                  <TouchableOpacity key={index} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.cardIcon,
                          { backgroundColor: iconColor },
                        ]}
                      >
                        <IconComponent size={24} color="white" />
                      </View>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          {alternative.savings_percentage}% OFF
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{alternative.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {alternative.brand ?? "Unknown"} •{" "}
                      {alternative.category ?? "General"}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceNew}>
                        {alternative.estimated_price}
                      </Text>
                      {alternative.original_price && (
                        <Text style={styles.priceOld}>
                          {alternative.original_price}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.reason}>{alternative.reason}</Text>

                    <View style={styles.featureRow}>
                      {(Array.isArray(alternative.key_features)
                        ? alternative.key_features
                        : []
                      ).map((feature, i) => (
                        <View key={i} style={styles.featureChip}>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.locationRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.locationText}>
                        Available at: {alternative.where_to_find}
                      </Text>
                    </View>

                    <View style={styles.bottomRow}>
                      <View style={styles.confidenceRow}>
                        <Text style={styles.confidenceText}>
                          AI Confidence:
                        </Text>
                        <View style={styles.starRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color={
                                star <=
                                Math.round((alternative.confidence ?? 0) * 5)
                                  ? "#fbbf24"
                                  : "#d1d5db"
                              }
                              fill={
                                star <=
                                Math.round((alternative.confidence ?? 0) * 5)
                                  ? "#fbbf24"
                                  : "none"
                              }
                            />
                          ))}
                        </View>
                      </View>
                      <TouchableOpacity style={styles.findButton}>
                        <Text style={styles.findButtonText}>Find Store</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!loading && alternatives.length === 0 && (
              <BlurView intensity={20} tint="light" style={styles.emptyBox}>
                <Lightbulb size={48} color="rgba(255,255,255,0.7)" />
                <Text style={styles.emptyTitle}>No Alternatives Found</Text>
                <Text style={styles.emptyText}>
                  {product
                    ? "Try scanning another product or check back later for new suggestions"
                    : "Start scanning products to get personalized suggestions"}
                </Text>
              </BlurView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20 },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 20,
  },
  aiBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  aiBadgeContent: { flexDirection: "row", alignItems: "center" },
  aiBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 6 },
  loadingBox: { borderRadius: 16, padding: 24, marginBottom: 16 },
  loadingText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  list: { gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e",
    backgroundColor: "#dcfce7",
  },
  discountText: { fontSize: 12, fontWeight: "700", color: "#22c55e" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  priceNew: { fontSize: 20, fontWeight: "bold", color: "#16a34a", marginRight: 8 },
  priceOld: { fontSize: 14, color: "#9ca3af", textDecorationLine: "line-through" },
  reason: { fontSize: 14, color: "#374151", marginBottom: 8 },
  featureRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  featureChip: { backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  featureText: { fontSize: 12, color: "#4b5563", fontWeight: "500" },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationText: { fontSize: 14, color: "#6b7280", marginLeft: 6 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confidenceRow: { flexDirection: "row", alignItems: "center" },
  confidenceText: { fontSize: 12, color: "#6b7280", marginRight: 6 },
  starRow: { flexDirection: "row" },
  findButton: { backgroundColor: "#22c55e", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  findButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyBox: { borderRadius: 16, padding: 24, alignItems: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 16, marginBottom: 8 },
  emptyText: { color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20 },
});
