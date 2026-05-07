import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StructuredAddress } from '../services/LocationService';
import { useLocation } from '../hooks/useLocation';
import { 
  MapPin, 
  Navigation, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  RefreshCcw,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';

export type AddressData = StructuredAddress;

interface AddressPickerProps {
  onAddressSelect: (address: AddressData) => void;
  initialAddress?: Partial<AddressData>;
}

export default function AddressPicker({ onAddressSelect, initialAddress }: AddressPickerProps) {
  const { loading, error, address: fetchedAddress, fetchLocation, openSettings } = useLocation();
  const [isManual, setIsManual] = useState(false);
  const [success, setSuccess] = useState(false);

  const [address, setAddress] = useState<AddressData>({
    formattedAddress: initialAddress?.formattedAddress || '',
    street: initialAddress?.street || '',
    houseNumber: initialAddress?.houseNumber || '',
    area: initialAddress?.area || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postalCode: initialAddress?.postalCode || '',
    country: initialAddress?.country || '',
    landmark: initialAddress?.landmark || '',
    latitude: initialAddress?.latitude || 0,
    longitude: initialAddress?.longitude || 0,
  });

  const handleManualChange = (field: keyof AddressData, value: string | number) => {
    setAddress(prev => {
      const next = { ...prev, [field]: value };
      if (field !== 'formattedAddress') {
        const parts = [
          next.houseNumber, 
          next.street, 
          next.area, 
          next.city, 
          next.state, 
          next.postalCode
        ].filter(Boolean);
        next.formattedAddress = parts.join(', ');
      }
      return next;
    });
  };

  // Sync when hook successfully fetches an address
  useEffect(() => {
    if (fetchedAddress) {
      setAddress(prev => ({
        ...prev,
        ...fetchedAddress,
        landmark: prev.landmark // Preserve typed landmark
      }));
      setSuccess(true);
      setIsManual(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  }, [fetchedAddress]);

  // Sync with parent whenever the address object changes
  useEffect(() => {
    if (address.formattedAddress) {
      onAddressSelect(address);
    }
  }, [address, onAddressSelect]);

  const handleFetchClick = () => {
    if (loading) return;
    setIsManual(false);
    fetchLocation();
  };

  return (
    <View style={styles.container}>
      {/* Main UI */}
      <View style={styles.content}>
        {!address.formattedAddress && !isManual && !loading && (
          <TouchableOpacity style={styles.allowBtn} onPress={handleFetchClick}>
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
                      placeholder="House/Flat No"
                      value={address.houseNumber}
                      onChangeText={(v) => handleManualChange('houseNumber', v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 2, marginLeft: 8 }]}
                      placeholder="Street/Road Name"
                      value={address.street}
                      onChangeText={(v) => handleManualChange('street', v)}
                    />
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Area/Locality"
                      value={address.area}
                      onChangeText={(v) => handleManualChange('area', v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, marginLeft: 8 }]}
                      placeholder="Landmark (Optional)"
                      value={address.landmark}
                      onChangeText={(v) => handleManualChange('landmark', v)}
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
                      placeholder="Pincode"
                      value={address.postalCode}
                      onChangeText={(v) => handleManualChange('postalCode', v)}
                      keyboardType="numeric"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: COLORS.darkText,
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
