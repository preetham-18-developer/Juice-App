import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBag, Clock, CheckCircle2, Truck, Package } from 'lucide-react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';

const STATUS_COLORS: any = {
  pending: '#F59E0B',
  preparing: '#3B82F6',
  out_for_delivery: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444'
};

export default function OrderManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      Alert.alert('Success', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={16} color={STATUS_COLORS.pending} />;
      case 'preparing': return <Package size={16} color={STATUS_COLORS.preparing} />;
      case 'out_for_delivery': return <Truck size={16} color={STATUS_COLORS.out_for_delivery} />;
      case 'delivered': return <CheckCircle2 size={16} color={STATUS_COLORS.delivered} />;
      default: return <Clock size={16} color={COLORS.mutedGray} />;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.profiles?.full_name || 'Guest User'}</Text>
        <Text style={styles.customerPhone}>{item.profiles?.phone || 'No phone provided'}</Text>
        <Text style={styles.address}>{item.delivery_address || 'Store Pickup'}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.orderSummary}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{item.total_amount}</Text>
      </View>

      <View style={styles.actionGrid}>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: STATUS_COLORS.preparing }]}
            onPress={() => updateOrderStatus(item.id, 'preparing')}
          >
            <Text style={styles.actionBtnText}>Start Preparing</Text>
          </TouchableOpacity>
        )}
        {item.status === 'preparing' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: STATUS_COLORS.out_for_delivery }]}
            onPress={() => updateOrderStatus(item.id, 'out_for_delivery')}
          >
            <Text style={styles.actionBtnText}>Send for Delivery</Text>
          </TouchableOpacity>
        )}
        {item.status === 'out_for_delivery' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: STATUS_COLORS.delivered }]}
            onPress={() => updateOrderStatus(item.id, 'delivered')}
          >
            <Text style={styles.actionBtnText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchOrders();
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <ShoppingBag size={64} color="#E2E8F0" />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  },
  backBtn: { padding: 4 },
  listContent: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.darkText,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.mutedGray,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.mutedGray,
    fontWeight: '600',
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: COLORS.darkText,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mutedGray,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryGreen,
  },
  actionGrid: {
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.mutedGray,
  }
});
