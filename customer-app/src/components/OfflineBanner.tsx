import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme/tokens';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  // In a real app, use @react-native-community/netinfo
  // This is a simplified version
  useEffect(() => {
    // Simulated connectivity check
    const checkStatus = () => {
      // Logic for connectivity
    };
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <WifiOff size={16} color={COLORS.white} style={styles.icon} />
      <Text style={styles.text}>No internet connection. Using offline mode.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
