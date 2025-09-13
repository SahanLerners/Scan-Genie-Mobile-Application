import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Dimensions, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ShoppingCart, Scan, Heart, ChartBar as BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const onboardingSteps = [
  {
    icon: ShoppingCart,
    title: 'AI Shopping Assistant',
    description: 'Your smart companion for making better food choices with AI-powered insights.',
    colors: ['#667eea', '#764ba2'],
  },
  {
    icon: Scan,
    title: 'Scan Products',
    description: 'Simply scan any barcode to get instant nutrition information and health insights.',
    colors: ['#f093fb', '#f5576c'],
  },
  {
    icon: Heart,
    title: 'Save Favorites',
    description: 'Keep track of your favorite products and build a personalized healthy shopping list.',
    colors: ['#4facfe', '#00f2fe'],
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor your scanning habits and discover patterns in your food choices.',
    colors: ['#43e97b', '#38f9d7'],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({ x: nextStep * width, animated: true });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(contentOffsetX / width);
    setCurrentStep(step);
  };

  return (
    <GradientBackground colors={onboardingSteps[currentStep].colors}>
      <View className="flex-1 pt-16">
        <TouchableOpacity className="absolute top-16 right-5 z-10 px-4 py-2" onPress={handleSkip}>
          <Text className="text-white text-base font-medium">Skip</Text>
        </TouchableOpacity>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          className="flex-1"
        >
          {onboardingSteps.map((step, index) => (
            <View key={index} style={{ width }} className="flex-1 justify-center items-center px-10">
              <View className="mb-10">
                <step.icon size={120} color="white" strokeWidth={1.5} />
              </View>
              
              <Text className="text-4xl font-bold text-white text-center mb-5">{step.title}</Text>
              <Text className="text-lg text-white/90 text-center leading-7">{step.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="px-10 pb-10">
          <View className="flex-row justify-center mb-8">
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${
                  index === currentStep 
                    ? 'w-5 bg-white' 
                    : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </View>

          <TouchableOpacity className="bg-white/20 rounded-3xl py-4 items-center border border-white/30" onPress={handleNext}>
            <Text className="text-white text-lg font-semibold">
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

// Keep minimal styles for complex layouts
const styles = StyleSheet.create({});