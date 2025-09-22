import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/services/firestore';
import { UserAnalytics } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChartBar as BarChart3,
  TrendingUp,
  Heart,
  Scan,
  Calendar,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const userAnalytics = await FirestoreService.getUserAnalytics(user.uid);
      setAnalytics(userAnalytics);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load analytics',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const getTopCategories = () => {
    if (!analytics?.categoriesScanned) return [];
    return Object.entries(analytics.categoriesScanned)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getCurrentMonthScans = () => {
    if (!analytics?.monthlyScans) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    return analytics.monthlyScans[currentMonth] || 0;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.flex1}>
        <SafeAreaView style={styles.flex1}>
          <View style={styles.centerContent}>
            <Text style={styles.whiteTextLg}>Loading analytics...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!analytics) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.flex1}>
        <SafeAreaView style={styles.flex1}>
          <View style={[styles.centerContent, { paddingHorizontal: 40, gap: 16 }]}>
            <BarChart3 size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.analyticsTitle}>No data yet</Text>
            <Text style={[styles.analyticsSubtitle, { textAlign: 'center', lineHeight: 24 }]}>
              Start scanning products to see your analytics!
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const topCategories = getTopCategories();
  const currentMonthScans = getCurrentMonthScans();

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.flex1}>
      <SafeAreaView style={styles.flex1}>
        <View style={styles.analyticsHeader}>
          <BarChart3 size={32} color="white" />
          <Text style={styles.analyticsTitle}>Your Analytics</Text>
          <Text style={styles.analyticsSubtitle}>
            Track your healthy shopping journey
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.container}>
            {/* Stats Overview */}
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <View style={styles.iconCircleGreen}>
                  <Scan size={24} color="white" />
                </View>
                <Text style={styles.cardNumber}>{analytics.totalScans}</Text>
                <Text style={styles.cardLabel}>Total Scans</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconCircleRed}>
                  <Heart size={24} color="white" />
                </View>
                <Text style={styles.cardNumber}>{analytics.favoriteCount}</Text>
                <Text style={styles.cardLabel}>Favorites</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconCircleBlue}>
                  <Calendar size={24} color="white" />
                </View>
                <Text style={styles.cardNumber}>{currentMonthScans}</Text>
                <Text style={styles.cardLabel}>This Month</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconCirclePurple}>
                  <TrendingUp size={24} color="white" />
                </View>
                <Text style={styles.cardNumber}>
                  {Object.keys(analytics.categoriesScanned).length}
                </Text>
                <Text style={styles.cardLabel}>Categories</Text>
              </View>
            </View>

            {/* Top Categories */}
            {topCategories.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Top Categories Scanned</Text>
                <View style={{ gap: 12 }}>
                  {topCategories.map(([category, count], index) => (
                    <View key={category} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryRank}>#{index + 1}</Text>
                        <Text style={styles.categoryName}>{category}</Text>
                      </View>
                      <View style={styles.categoryCountContainer}>
                        <Text style={styles.categoryCount}>{count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Monthly Activity */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Monthly Activity</Text>
              <View style={{ gap: 12 }}>
                {Object.entries(analytics.monthlyScans)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, count]) => {
                    const date = new Date(month + '-01');
                    const monthName = date.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    });
                    return (
                      <View key={month} style={styles.monthRow}>
                        <Text style={styles.monthText}>{monthName}</Text>
                        <Text style={styles.monthCount}>{count} scans</Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Achievement Card */}
            <View style={styles.achievementCard}>
              <Text style={styles.achievementTitle}>
                🏆 Achievement Unlocked!
              </Text>
              <Text style={styles.achievementText}>
                {analytics.totalScans >= 50
                  ? "Nutrition Expert - You've scanned 50+ products!"
                  : analytics.totalScans >= 25
                  ? "Health Explorer - You've scanned 25+ products!"
                  : analytics.totalScans >= 10
                  ? "Smart Shopper - You've scanned 10+ products!"
                  : 'Getting Started - Keep scanning to unlock achievements!'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  whiteText: { color: '#ffffff' },
  whiteTextLg: { color: '#ffffff', fontSize: 18 },
  analyticsHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  analyticsTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  analyticsSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  scrollView: { flex: 1 },
  container: { padding: 20, gap: 20 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  iconCircleGreen: {
    width: 48,
    height: 48,
    backgroundColor: '#22c55e',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleRed: {
    width: 48,
    height: 48,
    backgroundColor: '#ef4444',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleBlue: {
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCirclePurple: {
    width: 48,
    height: 48,
    backgroundColor: '#8b5cf6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardLabel: { fontSize: 12, color: '#4b5563', textAlign: 'center' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    width: 24,
  },
  categoryName: { fontSize: 14, color: '#111827', marginLeft: 12 },
  categoryCountContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryCount: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  monthText: { fontSize: 14, color: '#111827' },
  monthCount: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  achievementCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
});
