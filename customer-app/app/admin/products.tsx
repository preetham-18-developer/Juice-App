import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Image,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Plus, Filter, Package } from 'lucide-react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';

export default function ProductManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_available: !currentStatus } : p
      ));
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category || 'Juice'}</Text>
        <Text style={styles.productPrice}>₹{item.price || item.price_per_kg}</Text>
      </View>
      <View style={styles.actionArea}>
        <Text style={[styles.statusLabel, { color: item.is_available ? '#10B981' : '#EF4444' }]}>
          {item.is_available ? 'Available' : 'Sold Out'}
        </Text>
        <Switch 
          value={item.is_available !== false}
          onValueChange={() => toggleAvailability(item.id, item.is_available !== false)}
          trackColor={{ false: '#fee2e2', true: '#dcfce7' }}
          thumbColor={item.is_available ? '#10B981' : '#EF4444'}
        />
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
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={24} color={COLORS.primaryGreen} />
        </TouchableOpacity>
      </View>

      {/* Search Bar Placeholder */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.mutedGray} />
          <Text style={styles.searchPlaceholder}>Search juices...</Text>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchProducts();
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Package size={64} color="#E2E8F0" />
              <Text style={styles.emptyText}>No products found</Text>
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
  addBtn: { padding: 4 },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchPlaceholder: {
    color: COLORS.mutedGray,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  productCategory: {
    fontSize: 12,
    color: COLORS.mutedGray,
    fontWeight: '600',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryGreen,
    marginTop: 4,
  },
  actionArea: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
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
