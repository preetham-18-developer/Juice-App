import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Citrus, Home, ArrowLeft } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../src/theme/tokens';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Citrus size={80} color={COLORS.primaryOrange} />
        </View>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Squeezed too hard!</Text>
        <Text style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={COLORS.primaryGreen} style={{ marginRight: 6 }} />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 119, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryGreen,
    marginTop: -10,
  },
  message: {
    fontSize: 16,
    color: COLORS.mutedGray,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    color: COLORS.primaryGreen,
    fontSize: 16,
    fontWeight: '700',
  }
});
