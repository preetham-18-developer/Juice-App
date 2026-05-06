import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking } from 'react-native';
import { RefreshCcw, ExternalLink, MapPin } from 'lucide-react-native';
import { COLORS } from '../theme/tokens';

interface AddressMapProps {
  location: { latitude: number; longitude: number };
  addressName?: string;
  onRefresh: () => void;
}

export default function AddressMap({ location, addressName, onRefresh }: AddressMapProps) {
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.mapContainer}>
      <View style={styles.webFallback}>
        <MapPin size={32} color={COLORS.primaryGreen} />
        <Text style={styles.fallbackText} numberOfLines={2}>
          {addressName || `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
        </Text>
        <TouchableOpacity style={styles.linkBtn} onPress={openInGoogleMaps}>
          <ExternalLink size={14} color={COLORS.primaryGreen} />
          <Text style={styles.linkText}>View on Google Maps</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <RefreshCcw size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFallback: {
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkText: {
    fontSize: 12,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
  refreshBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
});
