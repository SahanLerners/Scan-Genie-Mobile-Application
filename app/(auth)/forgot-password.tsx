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
import { Mail, ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email address',
      });
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      Toast.show({
        type: 'success',
        text1: 'Reset Link Sent',
        text2: 'Check your email for the password reset link',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message || 'Could not send reset email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground colors={['#4facfe', '#00f2fe']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <BlurView className="rounded-2xl p-6 bg-white/10 border border-white/20 relative" intensity={20} tint="light">
            <TouchableOpacity
              className="absolute top-4 left-4 z-10 p-2"
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View className="items-center mb-8 mt-8">
              <Text className="text-3xl font-bold text-white mb-2">Forgot Password?</Text>
              <Text className="text-base text-white/80 text-center leading-6">
                {sent
                  ? 'We\'ve sent a reset link to your email'
                  : 'Enter your email to receive a reset link'}
              </Text>
            </View>

            {!sent ? (
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

                <TouchableOpacity
                  className={`bg-white rounded-xl py-4 items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text className="text-[#4facfe] text-lg font-semibold">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center gap-6">
                <Text className="text-white/90 text-base text-center leading-6">
                  If an account with that email exists, we've sent you a password reset link.
                </Text>
                
                <TouchableOpacity
                  className="py-3"
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text className="text-white text-base font-semibold underline">
                    Didn't receive it? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-white/80 text-base">Remember your password? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-white text-base font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}