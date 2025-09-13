import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/services/firestore';
import { UserAnalytics } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, TrendingUp, Heart, Scan, Calendar } from 'lucide-react-native';
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
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getCurrentMonthScans = () => {
    if (!analytics?.monthlyScans) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    return analytics.monthlyScans[currentMonth] || 0;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-lg">Loading analytics...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!analytics) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center px-10 gap-4">
            <BarChart3 size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text className="text-2xl font-bold text-white">No data yet</Text>
            <Text className="text-base text-white/80 text-center leading-6">
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
    <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="items-center pt-5 px-5 pb-5">
          <BarChart3 size={32} color="white" />
          <Text className="text-3xl font-bold text-white mt-3 mb-1">Your Analytics</Text>
          <Text className="text-base text-white/90">Track your healthy shopping journey</Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="p-5 gap-5">
            {/* Stats Overview */}
            <View className="flex-row flex-wrap gap-3">
              <View className="bg-white rounded-2xl p-4 items-center flex-1 min-w-[45%]">
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mb-3">
                  <Scan size={24} color="white" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">{analytics.totalScans}</Text>
                <Text className="text-xs text-gray-600 text-center">Total Scans</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 items-center flex-1 min-w-[45%]">
                <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center mb-3">
                  <Heart size={24} color="white" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">{analytics.favoriteCount}</Text>
                <Text className="text-xs text-gray-600 text-center">Favorites</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 items-center flex-1 min-w-[45%]">
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mb-3">
                  <Calendar size={24} color="white" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">{currentMonthScans}</Text>
                <Text className="text-xs text-gray-600 text-center">This Month</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 items-center flex-1 min-w-[45%]">
                <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center mb-3">
                  <TrendingUp size={24} color="white" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  {Object.keys(analytics.categoriesScanned).length}
                </Text>
                <Text className="text-xs text-gray-600 text-center">Categories</Text>
              </View>
            </View>

            {/* Top Categories */}
            {topCategories.length > 0 && (
              <View className="bg-white rounded-2xl p-5">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Top Categories Scanned</Text>
                <View className="gap-3">
                  {topCategories.map(([category, count], index) => (
                    <View key={category} className="flex-row justify-between items-center py-2">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-sm font-bold text-blue-600 w-6">#{index + 1}</Text>
                        <Text className="text-sm text-gray-900 ml-3">{category}</Text>
                      </View>
                      <View className="bg-gray-100 px-2 py-1 rounded-lg">
                        <Text className="text-xs font-semibold text-gray-600">{count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Monthly Activity */}
            <View className="bg-white rounded-2xl p-5">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</Text>
              <View className="gap-3">
                {Object.entries(analytics.monthlyScans)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, count]) => {
                    const date = new Date(month + '-01');
                    const monthName = date.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    });
                    return (
                      <View key={month} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                        <Text className="text-sm text-gray-900">{monthName}</Text>
                        <Text className="text-sm font-semibold text-gray-600">{count} scans</Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Achievement Card */}
            <View className="bg-white/90 rounded-2xl p-5 items-center">
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">🏆 Achievement Unlocked!</Text>
              <Text className="text-sm text-gray-700 text-center leading-5">
                {analytics.totalScans >= 50 
                  ? "Nutrition Expert - You've scanned 50+ products!"
                  : analytics.totalScans >= 25
                  ? "Health Explorer - You've scanned 25+ products!"
                  : analytics.totalScans >= 10
                  ? "Smart Shopper - You've scanned 10+ products!"
                  : "Getting Started - Keep scanning to unlock achievements!"
                }
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}