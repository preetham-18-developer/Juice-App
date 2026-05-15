import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings,
  TrendingUp,
  Plus,
  Users,
  Zap
} from 'lucide-react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

export default function NativeAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      
      const { data: revenueData } = await supabase.from('orders').select('total_amount').eq('status', 'delivered');
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

      setStats({
        orders: orderCount || 0,
        products: productCount || 0,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  const MenuButton = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
        <Icon size={24} color="#FFF" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.chevron}>
        <Plus size={20} color={COLORS.mutedGray} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Initializing Admin Console...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCcw size={20} color={COLORS.mutedGray} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back, Admin</Text>
          <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Revenue" 
            value={`₹${stats.revenue}`} 
            icon={TrendingUp} 
            color="#10B981" 
          />
          <View style={styles.statsRow}>
            <StatCard 
              title="Orders" 
              value={stats.orders} 
              icon={ShoppingBag} 
              color="#3B82F6" 
            />
            <StatCard 
              title="Products" 
              value={stats.products} 
              icon={Package} 
              color="#F59E0B" 
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Management</Text>
        </View>

        <View style={styles.menuList}>
          <MenuButton 
            title="Manage Orders" 
            subtitle="Track and update customer orders"
            icon={ShoppingBag}
            color="#3B82F6"
            onPress={() => router.push('/admin/orders')}
          />
          <MenuButton 
            title="Product Inventory" 
            subtitle="Add, edit or remove juices"
            icon={Package}
            color="#F59E0B"
            onPress={() => router.push('/admin/products')}
          />
          <MenuButton 
            title="Users & Roles" 
            subtitle="Manage customer profiles"
            icon={Users}
            color="#8B5CF6"
            onPress={() => {}}
          />
          <MenuButton 
            title="Shop Settings" 
            subtitle="Configure shop availability"
            icon={Settings}
            color="#64748B"
            onPress={() => {}}
          />
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <View style={styles.syncBadge}>
            <Zap size={12} color="#10B981" fill="#10B981" />
            <Text style={styles.syncText}>Connected to Production Database</Text>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Reuse some lucide icons if not already imported
const RefreshCcw = ({ size, color }: any) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color, fontSize: size - 4, fontWeight: 'bold' }}>⟳</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mutedGray,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: -0.5,
  },
  backBtn: {
    padding: 4,
  },
  refreshBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.mutedGray,
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.mutedGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.darkText,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.darkText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuList: {
    gap: 12,
  },
  menuButton: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.mutedGray,
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
