import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, displayName);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Welcome to AI Shopping Assistant!',
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: error.message || 'Could not create account',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground colors={['#f093fb', '#f5576c']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <BlurView className="rounded-2xl p-6 bg-white/10 border border-white/20" intensity={20} tint="light">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-white mb-2">Create Account</Text>
              <Text className="text-base text-white/80 text-center">Join us for a healthier lifestyle</Text>
            </View>

            <View className="gap-4">
              <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-4">
                <User size={20} color="#6c757d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Full name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

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
                  autoComplete="new-password"
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

              <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-4">
                <Lock size={20} color="#6c757d" className="mr-3" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6c757d" />
                  ) : (
                    <Eye size={20} color="#6c757d" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className={`bg-white rounded-xl py-4 items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text className="text-[#f093fb] text-lg font-semibold">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-white/80 text-base">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-white text-base font-semibold">Sign In</Text>
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