import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter both email and password',
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back!',
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground colors={['#667eea', '#764ba2']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <BlurView className="rounded-2xl p-6 bg-white/10 border border-white/20" intensity={20} tint="light">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-white mb-2">Welcome Back</Text>
              <Text className="text-base text-white/80 text-center">Sign in to continue your healthy journey</Text>
            </View>

            <View className="gap-4">
              <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-4">
                <Mail size={20} color="#6c757d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-4">
                <Lock size={20} color="#6c757d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6c757d" />
                  ) : (
                    <Eye size={20} color="#6c757d" />
                  )}
                </TouchableOpacity>
              </View>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="self-end -mt-2">
                  <Text className="text-white/80 text-sm">Forgot Password?</Text>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                className={`bg-white rounded-xl py-4 items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text className="text-[#667eea] text-lg font-semibold">
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-white/80 text-base">Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text className="text-white text-base font-semibold">Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

// Keep minimal styles for complex layouts that need StyleSheet
const styles = StyleSheet.create({});