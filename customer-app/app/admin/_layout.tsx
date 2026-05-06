import { Slot, useRouter, usePathname, Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { COLORS } from '../../src/theme/tokens';
import { LayoutDashboard, ShoppingCart, Apple, Package, LogOut, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';

const NavItem = ({ name, icon: Icon, label, isActive, onPress, isLarge }: any) => (
  <TouchableOpacity 
    style={[styles.navItem, isActive && styles.navItemActive]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.navItemContent}>
      <Icon size={20} color={isActive ? COLORS.primaryGreen : COLORS.mutedGray} />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
    </View>
    {isActive && isLarge && <View style={styles.activeIndicator} />}
  </TouchableOpacity>
);

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width: rnWidth } = useWindowDimensions();
  
  // High-reliability width detection
  const [width, setWidth] = useState(rnWidth > 0 ? rnWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const isLarge = width > 768;

  useEffect(() => {
    const handleResize = () => {
      if (Platform.OS === 'web') setWidth(window.innerWidth);
    };
    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (rnWidth > 0) setWidth(rnWidth);
  }, [rnWidth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Debug Indicator - will remove after confirmation */}
      {Platform.OS === 'web' && (
        <View style={{ position: 'absolute', top: 5, right: 5, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10 }}>W: {width} | L: {isLarge ? 'Y' : 'N'}</Text>
        </View>
      )}

      {isLarge ? (
        <View style={styles.container}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoCircle}>
                <Apple size={24} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.brandName}>JuiceShop</Text>
                <Text style={styles.brandSubtitle}>Admin Panel</Text>
              </View>
            </View>

            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>Main Menu</Text>
              <NavItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                isActive={pathname === '/admin' || pathname === '/admin/'} 
                onPress={() => router.push('/admin')} 
                isLarge={isLarge}
              />
              <NavItem 
                icon={ShoppingCart} 
                label="Orders" 
                isActive={pathname.includes('/admin/orders')} 
                onPress={() => router.push('/admin/orders')} 
                isLarge={isLarge}
              />
              <NavItem 
                icon={Apple} 
                label="Products" 
                isActive={pathname.includes('/admin/products')} 
                onPress={() => router.push('/admin/products')} 
                isLarge={isLarge}
              />
              <NavItem 
                icon={Package} 
                label="Inventory" 
                isActive={pathname.includes('/admin/inventory')} 
                onPress={() => router.push('/admin/inventory')} 
                isLarge={isLarge}
              />
            </View>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      ) : (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: COLORS.primaryGreen,
            tabBarInactiveTintColor: COLORS.mutedGray,
            tabBarStyle: {
              backgroundColor: COLORS.white,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 8,
            },
            headerStyle: { backgroundColor: COLORS.white },
            headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
            headerShadowVisible: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="orders"
            options={{
              title: 'Orders',
              tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="products"
            options={{
              title: 'Products',
              tabBarIcon: ({ color, size }) => <Apple size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="inventory"
            options={{
              title: 'Inventory',
              tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
            }}
          />
        </Tabs>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  sidebar: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 24,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.mutedGray,
    fontWeight: '600',
  },
  navSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#10b98110',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mutedGray,
  },
  navLabelActive: {
    color: COLORS.primaryGreen,
  },
  activeIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: COLORS.primaryGreen,
  },
  sidebarFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
  content: {
    flex: 1,
  },
});
