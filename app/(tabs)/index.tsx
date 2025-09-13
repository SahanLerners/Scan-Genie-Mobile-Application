import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { OpenFoodFactsService } from '@/services/openFoodFacts';
import { AIProductSearchService } from '@/services/aiProductSearch';
import { FirestoreService } from '@/services/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Camera, Image as ImageIcon, Scan, Sparkles, X, FlashlightOff as FlashOff, Slash as FlashOn, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function Home() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanning) return;
    
    setScanning(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      Toast.show({
        type: 'info',
        text1: 'Scanning Product',
        text2: 'Looking up product information...',
      });

      const product = await OpenFoodFactsService.getProductByBarcode(data);
      
      if (product && user) {
        await FirestoreService.addScanToHistory(user.uid, product);
        
        Toast.show({
          type: 'success',
          text1: 'Product Found!',
          text2: product.name,
        });

        setShowCamera(false);
        router.push({
          pathname: '/(tabs)/results',
          params: { 
            productData: JSON.stringify(product),
            aiIdentified: 'false'
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Product Not Found',
          text2: 'Try scanning again or use AI photo scan',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Scan Error',
        text2: 'Please try again',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleAIPhotoScan = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processAIImage(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processAIImage(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo',
      });
    }
  };

  const processAIImage = async (imageUri: string) => {
    setAiProcessing(true);
    
    try {
      Toast.show({
        type: 'info',
        text1: 'AI Analysis',
        text2: 'AI is analyzing your image...',
      });

      const identification = await AIProductSearchService.identifyProductFromImage(imageUri);
      
      if (identification && identification.product_name) {
        // Search Open Food Facts for the identified product
        const products = await OpenFoodFactsService.searchProductsByName(
          identification.product_name,
          identification.category
        );

        let finalProduct;
        if (products.length > 0) {
          finalProduct = products[0];
        } else {
          // Create a basic product from AI identification
          finalProduct = {
            id: `ai_${Date.now()}`,
            barcode: `ai_${Date.now()}`,
            name: identification.product_name,
            brand: identification.brand,
            category: identification.category,
            imageUrl: imageUri,
            nutritionGrade: undefined,
            ingredients: identification.key_features,
            allergens: [],
            nutritionFacts: undefined,
            scannedAt: new Date(),
          };
        }

        if (user) {
          await FirestoreService.addScanToHistory(user.uid, finalProduct);
        }

        Toast.show({
          type: 'success',
          text1: 'Product Identified!',
          text2: identification.product_name,
        });

        router.push({
          pathname: '/(tabs)/results',
          params: { 
            productData: JSON.stringify(finalProduct),
            aiIdentified: 'true',
            originalImage: imageUri
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'AI Analysis Failed',
          text2: 'Could not identify product from image',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'AI Error',
        text2: 'Please check your API key configuration',
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(!flash);
  };

  if (!permission) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">Loading camera...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center px-8">
          <Camera size={64} color="rgba(255, 255, 255, 0.7)" />
          <Text className="text-2xl font-bold text-white mt-6 mb-4 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-base text-white/80 text-center mb-8 leading-6">
            We need camera access to scan product barcodes and take photos for AI analysis
          </Text>
          <TouchableOpacity 
            className="bg-white/20 border border-white/30 rounded-xl px-8 py-4"
            onPress={requestPermission}
          >
            <Text className="text-white text-lg font-semibold">Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showCamera) {
    return (
      <View className="flex-1">
        <CameraView 
          className="flex-1" 
          facing={facing}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'ean13', 'ean8', 'code128', 'code39'],
          }}
        >
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5">
              <TouchableOpacity 
                className="w-12 h-12 bg-black/50 rounded-full items-center justify-center"
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              
              <BlurView className="px-4 py-2 rounded-xl" intensity={20} tint="dark">
                <Text className="text-white font-semibold">Scan Barcode</Text>
              </BlurView>

              <View className="w-12" />
            </View>

            {/* Scanning Area */}
            <View className="flex-1 justify-center items-center">
              <View className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                <View className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-xl" />
                <View className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-xl" />
                <View className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-xl" />
                <View className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-xl" />
                
                {scanning && (
                  <View className="absolute inset-0 bg-white/20 rounded-2xl items-center justify-center">
                    <Text className="text-white font-semibold">Scanning...</Text>
                  </View>
                )}
              </View>
              
              <Text className="text-white text-center mt-6 px-8 leading-6">
                Position the barcode within the frame to scan
              </Text>
            </View>

            {/* Controls */}
            <View className="flex-row justify-center items-center p-8 gap-8">
              <TouchableOpacity 
                className="w-14 h-14 bg-black/50 rounded-full items-center justify-center"
                onPress={toggleFlash}
              >
                {flash ? (
                  <FlashOn size={24} color="white" />
                ) : (
                  <FlashOff size={24} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                className="w-14 h-14 bg-black/50 rounded-full items-center justify-center"
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Header */}
            <View className="items-center mb-8 mt-4">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                <Scan size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-white mb-2">AI Shopping Assistant</Text>
              <Text className="text-base text-white/90 text-center leading-6">
                Scan products or take photos to get instant information and find cheaper alternatives
              </Text>
            </View>

            {/* Main Actions */}
            <View className="gap-4 mb-8">
              {/* Barcode Scanner */}
              <TouchableOpacity 
                className="bg-white/20 border border-white/30 rounded-2xl p-6 items-center"
                onPress={() => setShowCamera(true)}
                disabled={scanning}
              >
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Camera size={28} color="white" />
                </View>
                <Text className="text-xl font-bold text-white mb-2">Scan Barcode</Text>
                <Text className="text-sm text-white/80 text-center leading-5">
                  Point your camera at any product barcode for instant information
                </Text>
              </TouchableOpacity>

              {/* AI Photo Scan */}
              <TouchableOpacity 
                className="bg-white/20 border border-white/30 rounded-2xl p-6 items-center"
                onPress={handleTakePhoto}
                disabled={aiProcessing}
              >
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Sparkles size={28} color="white" />
                </View>
                <Text className="text-xl font-bold text-white mb-2">
                  {aiProcessing ? 'AI Analyzing...' : 'AI Photo Scan'}
                </Text>
                <Text className="text-sm text-white/80 text-center leading-5">
                  Take a photo of any product - no barcode needed! AI will identify it
                </Text>
              </TouchableOpacity>

              {/* Upload Photo */}
              <TouchableOpacity 
                className="bg-white/20 border border-white/30 rounded-2xl p-6 items-center"
                onPress={handleAIPhotoScan}
                disabled={aiProcessing}
              >
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  <ImageIcon size={28} color="white" />
                </View>
                <Text className="text-xl font-bold text-white mb-2">Upload Photo</Text>
                <Text className="text-sm text-white/80 text-center leading-5">
                  Select a photo from your gallery for AI analysis
                </Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <BlurView className="rounded-2xl p-6 bg-white/10 border border-white/20" intensity={20} tint="light">
              <Text className="text-lg font-bold text-white mb-4">✨ Smart Features</Text>
              <View className="gap-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-white rounded-full mr-3" />
                  <Text className="text-white/90 text-sm flex-1">
                    Instant product recognition with AI
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-white rounded-full mr-3" />
                  <Text className="text-white/90 text-sm flex-1">
                    Find cheaper alternatives automatically
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-white rounded-full mr-3" />
                  <Text className="text-white/90 text-sm flex-1">
                    Nutrition information and health insights
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-white rounded-full mr-3" />
                  <Text className="text-white/90 text-sm flex-1">
                    Save favorites and track your shopping
                  </Text>
                </View>
              </View>
            </BlurView>

            {/* Quick Stats */}
            {user && (
              <View className="mt-6">
                <Text className="text-lg font-bold text-white mb-4 text-center">
                  Welcome back, {user.displayName || 'Shopper'}! 👋
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity 
                    className="flex-1 bg-white/10 rounded-xl p-4 items-center"
                    onPress={() => router.push('/(tabs)/favorites')}
                  >
                    <Text className="text-2xl font-bold text-white">❤️</Text>
                    <Text className="text-xs text-white/80 mt-1">Favorites</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-white/10 rounded-xl p-4 items-center"
                    onPress={() => router.push('/(tabs)/analytics')}
                  >
                    <Text className="text-2xl font-bold text-white">📊</Text>
                    <Text className="text-xs text-white/80 mt-1">Analytics</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 bg-white/10 rounded-xl p-4 items-center"
                    onPress={() => router.push('/(tabs)/suggestions')}
                  >
                    <Text className="text-2xl font-bold text-white">💡</Text>
                    <Text className="text-xs text-white/80 mt-1">Suggestions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}