import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { TrendingUp, ShoppingBag, Package, Users, ArrowUpRight, ArrowDownRight, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';

const SimpleBarChart = ({ data, title }: { data: number[], title: string }) => {
  const max = Math.max(...data);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.barContainer}>
        {data.map((val, i) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[styles.bar, { 
              height: (val / max) * 100, 
              backgroundColor: i === data.length - 1 ? COLORS.primaryGreen : COLORS.border 
            }]} />
            <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const StatCard = ({ title, value, change, isPositive, icon: Icon, color, isLarge }: any) => (
  <View style={[styles.statCard, isLarge && styles.statCardLarge]}>
    <View style={styles.statHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
        {isPositive ? <ArrowUpRight size={12} color="#2E7D32" /> : <ArrowDownRight size={12} color="#C62828" />}
        <Text style={[styles.changeText, { color: isPositive ? '#2E7D32' : '#C62828' }]}>{change}%</Text>
      </View>
    </View>
    <Text style={[styles.statValue, isLarge && { fontSize: 28 }]}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { width: rnWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Platform.OS === 'web' ? window.innerWidth : rnWidth);
  const isLarge = width > 768;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (rnWidth > 0) setWidth(rnWidth);
  }, [rnWidth]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d'>('today');
  const [stats, setStats] = useState({
    filteredSales: 0,
    totalOrders: 0,
    growth: 12.5,
    dailyData: [45, 62, 58, 75, 90, 82, 95],
    activeUsers: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let filterStart = new Date();
      
      if (timeFilter === 'today') {
        filterStart.setHours(0, 0, 0, 0);
      } else if (timeFilter === '7d') {
        filterStart.setDate(now.getDate() - 7);
      } else if (timeFilter === '30d') {
        filterStart.setDate(now.getDate() - 30);
      }

      const [
        { data: orders, error: ordersErr },
        { data: profiles, error: profilesErr }
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, created_at').gte('created_at', filterStart.toISOString()),
        supabase.from('profiles').select('id')
      ]);

      if (ordersErr) throw ordersErr;
      if (profilesErr) throw profilesErr;

      if (orders) {
        const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        setStats(prev => ({
          ...prev,
          filteredSales: totalSales,
          totalOrders: orders.length,
          activeUsers: profiles?.length || 0
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isLarge && styles.containerLarge]}
      contentContainerStyle={isLarge && styles.scrollContentLarge}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={[styles.header, isLarge && styles.headerLarge]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Revenue Overview</Text>
            <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          </View>
          {!isLarge && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={20} color={COLORS.darkText} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          {(['today', '7d', '30d'] as const).map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Text style={[styles.filterText, timeFilter === f && styles.filterTextActive]}>
                {f === 'today' ? 'Today' : f === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.statsGrid, isLarge && styles.statsGridLarge]}>
        <StatCard 
          title={timeFilter === 'today' ? "Sales Today" : `Sales (${timeFilter})`}
          value={`₹${stats.filteredSales}`} 
          change="8.2" 
          isPositive={true} 
          icon={TrendingUp} 
          color="#2E7D32" 
          isLarge={isLarge}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          change="5.4" 
          isPositive={true} 
          icon={ShoppingBag} 
          color="#0288D1" 
          isLarge={isLarge}
        />
        <StatCard 
          title="Revenue Growth" 
          value={`${stats.growth}%`} 
          change="2.1" 
          isPositive={true} 
          icon={TrendingUp} 
          color="#F57C00" 
          isLarge={isLarge}
        />
        <StatCard 
          title="Total Users" 
          value={stats.activeUsers} 
          change="12" 
          isPositive={true} 
          icon={Users} 
          color="#7B1FA2" 
          isLarge={isLarge}
        />
      </View>

      <View style={isLarge && styles.chartsSectionLarge}>
        <View style={{ flex: 1.5 }}>
          <SimpleBarChart data={stats.dailyData} title="Weekly Sales Trend" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.summaryCard, isLarge && { marginTop: SPACING.lg }]}>
            <Text style={styles.summaryTitle}>Business Performance</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Avg. Order Value</Text>
                <Text style={styles.summaryValue}>₹245.00</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.summaryLabel}>Conversion Rate</Text>
                <Text style={styles.summaryValue}>3.4%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: SPACING.md,
  },
  containerLarge: {
    padding: 40,
  },
  scrollContentLarge: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerLarge: {
    marginBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedGray,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.mutedGray,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statsGridLarge: {
    gap: 24,
  },
  statCard: {
    width: (Dimensions.get('window').width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statCardLarge: {
    width: '23%',
    padding: 24,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mutedGray,
    marginTop: 2,
    fontWeight: '500',
  },
  chartsSectionLarge: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 20,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 20,
  },
  barWrapper: {
    alignItems: 'center',
    width: 30,
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.mutedGray,
    marginTop: 8,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: COLORS.darkText,
    borderRadius: 24,
    padding: 24,
    marginTop: SPACING.lg,
  },
  summaryTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
});
