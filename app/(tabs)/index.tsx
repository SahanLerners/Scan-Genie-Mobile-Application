import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
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

const { width } = Dimensions.get('window');

export default function Home() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        const products = await OpenFoodFactsService.searchProductsByName(
          identification.product_name,
          identification.category
        );

        let finalProduct;
        if (products.length > 0) {
          finalProduct = products[0];
        } else {
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
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.permissionContainer}>
          <Camera size={64} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.permissionTitle}>
            Camera Permission Required
          </Text>
          <Text style={styles.permissionSubtitle}>
            We need camera access to scan product barcodes and take photos for AI analysis
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing={facing}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'ean13', 'ean8', 'code128', 'code39'],
          }}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              
              <BlurView style={styles.scanningLabel} intensity={20} tint="dark">
                <Text style={styles.scanningLabelText}>Scan Barcode</Text>
              </BlurView>

              <View style={styles.spacer} />
            </View>

            <View style={styles.scanningArea}>
              <View style={styles.scanningFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                
                {scanning && (
                  <View style={styles.scanningOverlay}>
                    <Text style={styles.scanningText}>Scanning...</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.scanningInstructions}>
                Position the barcode within the frame to scan
              </Text>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraControlButton}
                onPress={toggleFlash}
              >
                {flash ? (
                  <FlashOn size={24} color="white" />
                ) : (
                  <FlashOff size={24} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cameraControlButton}
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
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Scan size={32} color="white" />
              </View>
              <Text style={styles.title}>AI Shopping Assistant</Text>
              <Text style={styles.subtitle}>
                Scan products or take photos to get instant information and find cheaper alternatives
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => setShowCamera(true)}
                disabled={scanning}
              >
                <View style={styles.actionIconContainer}>
                  <Camera size={28} color="white" />
                </View>
                <Text style={styles.actionTitle}>Scan Barcode</Text>
                <Text style={styles.actionDescription}>
                  Point your camera at any product barcode for instant information
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleTakePhoto}
                disabled={aiProcessing}
              >
                <View style={styles.actionIconContainer}>
                  <Sparkles size={28} color="white" />
                </View>
                <Text style={styles.actionTitle}>
                  {aiProcessing ? 'AI Analyzing...' : 'AI Photo Scan'}
                </Text>
                <Text style={styles.actionDescription}>
                  Take a photo of any product - no barcode needed! AI will identify it
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleAIPhotoScan}
                disabled={aiProcessing}
              >
                <View style={styles.actionIconContainer}>
                  <ImageIcon size={28} color="white" />
                </View>
                <Text style={styles.actionTitle}>Upload Photo</Text>
                <Text style={styles.actionDescription}>
                  Select a photo from your gallery for AI analysis
                </Text>
              </TouchableOpacity>
            </View>

            <BlurView style={styles.featuresCard} intensity={20} tint="light">
              <Text style={styles.featuresTitle}>✨ Smart Features</Text>
              <View style={styles.featuresList}>
                {[
                  'Instant product recognition with AI',
                  'Find cheaper alternatives automatically',
                  'Nutrition information and health insights',
                  'Save favorites and track your shopping'
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </BlurView>

            {user && (
              <View style={styles.userSection}>
                <Text style={styles.welcomeText}>
                  Welcome back, {user.displayName || 'Shopper'}! 👋
                </Text>
                <View style={styles.quickStats}>
                  {[
                    { emoji: '❤️', label: 'Favorites', route: '/(tabs)/favorites' },
                    { emoji: '📊', label: 'Analytics', route: '/(tabs)/analytics' },
                    { emoji: '💡', label: 'Suggestions', route: '/(tabs)/suggestions' }
                  ].map((stat, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.statCard}
                      onPress={() => router.push(stat.route as any)}
                    >
                      <Text style={styles.statEmoji}>{stat.emoji}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cameraButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scanningLabelText: {
    color: 'white',
    fontWeight: '600',
  },
  spacer: {
    width: 48,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: 256,
    height: 256,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'white',
  },
  cornerTopLeft: {
    top: -4,
    left: -4,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -4,
    right: -4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -4,
    left: -4,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -4,
    right: -4,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    color: 'white',
    fontWeight: '600',
  },
  scanningInstructions: {
    color: 'white',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 32,
  },
  cameraControlButton: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureBullet: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginRight: 12,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  userSection: {
    marginTop: 24,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});