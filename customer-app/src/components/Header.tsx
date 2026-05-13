import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { JuicyLogo } from './JuicyLogo';
import { ShoppingCart, User, Search, X, MapPin, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../hooks/useLocation';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
  onFilterPress?: () => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchValue = '',
  onSearchChange,
  onSearchClear,
  onFilterPress,
  showSearch = true
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isFocused, setIsFocused] = useState(false);

  // Location Hook
  const { address, loading: locating, fetchLocation, error: locationError } = useLocation();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const handleIconPress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const handleLocationPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    fetchLocation();
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="light" style={styles.blurContainer}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          
          {/* Main Layout Row */}
          <View style={styles.mainRow}>
            {/* Logo Section */}
            <TouchableOpacity 
              style={styles.logoSection} 
              onPress={() => router.push('/')}
              activeOpacity={0.8}
            >
              <JuicyLogo size={isDesktop ? 36 : 32} withText={false} />
              {isDesktop && <Text style={styles.logoText}>Juicy</Text>}
            </TouchableOpacity>

            {/* Location Selector */}
            <TouchableOpacity 
              style={styles.locationContainer} 
              activeOpacity={0.7}
              onPress={handleLocationPress}
              disabled={locating}
            >
              <View style={styles.locationIconBg}>
                {locating ? (
                  <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                ) : (
                  <MapPin size={16} color={COLORS.primaryGreen} fill={COLORS.primaryGreen + '20'} />
                )}
              </View>
              <View style={styles.locationInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.locationLabel}>
                    {locating ? 'Locating...' : 'Delivery in 12 mins'}
                  </Text>
                  {!locating && <ChevronDown size={14} color={COLORS.darkText} />}
                </View>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {address ? `${address.area || address.city} • Home` : 'Select Location • Home'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* LARGE SEARCH BAR - Desktop/Tablet Layout */}
            {(isDesktop || isTablet) && showSearch && (
              <View style={[
                styles.searchContainer, 
                styles.searchContainerLarge,
                isFocused && styles.searchContainerFocused
              ]}>
                <Search size={20} color={isFocused ? COLORS.primaryGreen : COLORS.mutedGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for juices, fruits, vegetables..."
                  placeholderTextColor={COLORS.mutedGray}
                  value={searchValue}
                  onChangeText={onSearchChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoCorrect={false}
                />
                {searchValue.length > 0 && (
                  <TouchableOpacity onPress={onSearchClear} style={styles.clearBtn}>
                    <X size={18} color={COLORS.mutedGray} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Right Action Icons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.iconBtn} 
                onPress={() => handleIconPress('/profile')}
              >
                <User size={24} color={COLORS.darkText} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.iconBtn, styles.cartBtn]} 
                onPress={() => handleIconPress('/(tabs)/cart')}
              >
                <ShoppingCart size={24} color={COLORS.white} />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* MOBILE SEARCH BAR - Second Row */}
          {!isDesktop && !isTablet && showSearch && (
            <View style={[
              styles.searchRowMobile,
              isFocused && styles.searchContainerFocused
            ]}>
              <Search size={18} color={isFocused ? COLORS.primaryGreen : COLORS.mutedGray} />
              <TextInput
                style={styles.searchInputMobile}
                placeholder="Search 'fresh mangoes'..."
                placeholderTextColor={COLORS.mutedGray}
                value={searchValue}
                onChangeText={onSearchChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCorrect={false}
              />
              {searchValue.length > 0 && (
                <TouchableOpacity onPress={onSearchClear} style={styles.clearBtn}>
                  <X size={16} color={COLORS.mutedGray} />
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1000,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
      }
    })
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  containerDesktop: {
    paddingHorizontal: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    gap: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: -0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  locationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.darkText,
  },
  locationValue: {
    fontSize: 12,
    color: COLORS.mutedGray,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerLarge: {
    maxWidth: 600,
  },
  searchContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.primaryGreen,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkText,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  searchRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInputMobile: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkText,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cartBtn: {
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    paddingHorizontal: 12,
    width: 'auto',
    minWidth: 50,
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.primaryOrange,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    marginLeft: -4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
  clearBtn: {
    padding: 4,
  }
});
