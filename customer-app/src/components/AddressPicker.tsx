import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { 
  MapPin, 
  Navigation, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  X,
  RefreshCcw,
  Search
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';

export interface AddressData {
  street: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface AddressPickerProps {
  onAddressSelect: (address: AddressData) => void;
  initialAddress?: Partial<AddressData>;
}

export default function AddressPicker({ onAddressSelect, initialAddress }: AddressPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [success, setSuccess] = useState(false);

  const [address, setAddress] = useState<AddressData>({
    street: initialAddress?.street || '',
    locality: initialAddress?.locality || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postalCode: initialAddress?.postalCode || '',
    country: initialAddress?.country || '',
    formattedAddress: initialAddress?.formattedAddress || '',
    latitude: initialAddress?.latitude || 0,
    longitude: initialAddress?.longitude || 0,
  });

  const handleManualChange = (field: keyof AddressData, value: string | number) => {
    setAddress(prev => {
      const next = { ...prev, [field]: value };
      // Update formatted address on field changes
      if (field !== 'formattedAddress') {
        const parts = [next.street, next.locality, next.city, next.state, next.postalCode, next.country].filter(Boolean);
        next.formattedAddress = parts.join(', ');
      }
      return next;
    });
  };

  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const res = results[0];
        const newAddress: AddressData = {
          street: res.name || res.street || '',
          locality: res.district || res.subregion || '',
          city: res.city || '',
          state: res.region || '',
          postalCode: res.postalCode || '',
          country: res.country || '',
          formattedAddress: [res.name, res.district, res.city, res.region, res.postalCode, res.country].filter(Boolean).join(', '),
          latitude,
          longitude,
        };
        setAddress(newAddress);
        setSuccess(true);
        onAddressSelect(newAddress);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Geocoding failed. Please enter address manually.');
      setIsManual(true);
    }
  };

  const handleAllowLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        Alert.alert(
          'Permission Denied',
          'We need location access to autofill your address. Would you like to open settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLoading(false);
        return;
      }

      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        setError('Location services disabled');
        Alert.alert('GPS Disabled', 'Please enable location services in your device settings.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });
      await fetchAddressFromCoords(latitude, longitude);
    } catch (err) {
      setError('Failed to fetch location. Try again or enter manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Preview */}
      {location && !isManual && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={location}>
              <View style={styles.markerContainer}>
                <View style={styles.markerCircle} />
              </View>
            </Marker>
          </MapView>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleAllowLocation}>
            <RefreshCcw size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Main UI */}
      <View style={styles.content}>
        {!address.formattedAddress && !isManual && !loading && (
          <TouchableOpacity style={styles.allowBtn} onPress={handleAllowLocation}>
            <LinearGradient
              colors={[COLORS.primaryGreen, '#1b5e20']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Navigation size={20} color={COLORS.white} />
              <Text style={styles.allowBtnText}>Use My Current Location</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primaryGreen} />
            <Text style={styles.loadingText}>Fetching your location...</Text>
          </View>
        )}

        {(address.formattedAddress || isManual) && (
          <View style={styles.addressBox}>
            <View style={styles.addressHeader}>
              <View style={styles.headerTitleRow}>
                <MapPin size={18} color={COLORS.primaryGreen} />
                <Text style={styles.addressTitle}>Delivery Address</Text>
              </View>
              {success && (
                <View style={styles.successBadge}>
                  <CheckCircle size={12} color={COLORS.success} />
                  <Text style={styles.successText}>Detected Successfully</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Edit3 size={16} color={COLORS.mutedGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.mainInput}
                  value={address.formattedAddress}
                  placeholder="Enter full address"
                  onChangeText={(val) => handleManualChange('formattedAddress', val)}
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={styles.toggleManualBtn} 
                onPress={() => setIsManual(!isManual)}
              >
                <Text style={styles.toggleManualText}>
                  {isManual ? 'Collapse details' : 'Edit details manually'}
                </Text>
                <ChevronRight size={14} color={COLORS.primaryGreen} style={{ transform: [{ rotate: isManual ? '270deg' : '90deg' }] }} />
              </TouchableOpacity>

              {isManual && (
                <View style={styles.manualFields}>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Street/House No"
                      value={address.street}
                      onChangeText={(v) => handleManualChange('street', v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, marginLeft: 8 }]}
                      placeholder="Area/Locality"
                      value={address.locality}
                      onChangeText={(v) => handleManualChange('locality', v)}
                    />
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="City"
                      value={address.city}
                      onChangeText={(v) => handleManualChange('city', v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, marginLeft: 8 }]}
                      placeholder="Postal Code"
                      value={address.postalCode}
                      onChangeText={(v) => handleManualChange('postalCode', v)}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setIsManual(true)}>
              <Text style={styles.manualEntryLink}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isManual && !address.formattedAddress && (
          <TouchableOpacity style={styles.manualOption} onPress={() => setIsManual(true)}>
            <Edit3 size={14} color={COLORS.mutedGray} />
            <Text style={styles.manualOptionText}>Enter Address Manually</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  mapContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    padding: 10,
  },
  markerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGreen,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  refreshBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: SPACING.md,
  },
  allowBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  allowBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: 10,
  },
  loadingText: {
    color: COLORS.mutedGray,
    fontSize: 14,
    fontWeight: '600',
  },
  addressBox: {
    gap: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  successText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  inputGroup: {
    gap: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  mainInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkText,
    fontWeight: '500',
    minHeight: 40,
  },
  toggleManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleManualText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
  manualFields: {
    gap: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  manualEntryLink: {
    color: COLORS.primaryGreen,
    fontWeight: '700',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  manualOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  manualOptionText: {
    color: COLORS.mutedGray,
    fontSize: 13,
    fontWeight: '600',
  },
});
