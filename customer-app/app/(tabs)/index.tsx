import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  StatusBar,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/theme/tokens';
import { Header } from '../../src/components/Header';
import { HeroBanner } from '../../src/components/HeroBanner';
import { CategoryPill } from '../../src/components/CategoryPill';
import { ProductCard } from '../../src/components/ProductCard';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { supabase } from '../../lib/supabase';
import { Product } from '../../src/types';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store/useCartStore';
import { Apple, Bean, Cherry, Citrus, Grape, Leaf } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Citrus size={24} color={COLORS.darkText} /> },
  { id: 'apple', label: 'Apple', icon: <Apple size={24} color={COLORS.darkText} /> },
  { id: 'kiwi', label: 'Kiwi', icon: <Bean size={24} color={COLORS.darkText} /> },
  { id: 'cherry', label: 'Cherry', icon: <Cherry size={24} color={COLORS.darkText} /> },
  { id: 'grape', label: 'Grape', icon: <Grape size={24} color={COLORS.darkText} /> },
  { id: 'leaf', label: 'Organic', icon: <Leaf size={24} color={COLORS.darkText} /> },
];

import { DestinationCard } from '../../src/components/ui/card';
import { ScrollTriggered } from '../../src/components/ui/stack-card';
import Slideshow from '../../src/components/ui/slideshow';

export default function HomeScreen() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [mainFilter, setMainFilter] = useState<'all' | 'juice' | 'fruit'>('all');
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network connection timed out.')), 15000)
      );

      const result = await Promise.race([
        supabase.from('products').select('*').eq('is_available', true),
        timeoutPromise
      ]) as { data: any; error: any };

      if (result.error) throw result.error;
      setProducts(result.data || []);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleFruitSelect = (fruitName: string) => {
    // Find product ID by name (case insensitive)
    const product = products.find(p => p.name.toLowerCase().includes(fruitName.toLowerCase()));
    if (product) {
      router.push({ pathname: '/product/[id]', params: { id: product.id } });
    } else {
      Alert.alert("Coming Soon", `${fruitName} will be back in stock shortly!`);
    }
  };

  const toggleLike = (productId: string) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesMain = mainFilter === 'all' || p.category === mainFilter;
    const matchesSearch = activeCategory === 'all' || p.name.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesMain && matchesSearch;
  });

  const renderSkeleton = () => (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonLoader width="100%" height={160} borderRadius={20} />
          <View style={{ marginTop: 12 }}>
            <SkeletonLoader width="80%" height={20} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <SkeletonLoader width="40%" height={24} />
              <SkeletonLoader width={32} height={32} borderRadius={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <OfflineBanner />
      <Header />
      
      {/* Main Filter Section (Juices / Fruits) */}
      <View style={styles.mainFilterWrapper}>
        <View style={styles.mainFilterContainer}>
          <TouchableOpacity 
            style={[styles.mainFilterBtn, mainFilter === 'all' && styles.mainFilterBtnActive]}
            onPress={() => setMainFilter('all')}
          >
            <Text style={[styles.mainFilterText, mainFilter === 'all' && styles.mainFilterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mainFilterBtn, mainFilter === 'juice' && styles.mainFilterBtnActive]}
            onPress={() => setMainFilter('juice')}
          >
            <Text style={[styles.mainFilterText, mainFilter === 'juice' && styles.mainFilterTextActive]}>Juices</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mainFilterBtn, mainFilter === 'fruit' && styles.mainFilterBtnActive]}
            onPress={() => setMainFilter('fruit')}
          >
            <Text style={[styles.mainFilterText, mainFilter === 'fruit' && styles.mainFilterTextActive]}>Fruits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mainFilter === 'fruit' ? (
        <ScrollTriggered onSelectProduct={handleFruitSelect} />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
          }
        >
          <Slideshow />
          <HeroBanner />

          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={TYPOGRAPHY.h3}>Top Choices</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoryList}
            >
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  label={cat.label}
                  icon={React.cloneElement(cat.icon as React.ReactElement, { 
                    color: activeCategory === cat.id ? COLORS.white : COLORS.darkText 
                  })}
                  active={activeCategory === cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Popular Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={TYPOGRAPHY.h2}>{mainFilter === 'all' ? 'Popular Items' : 'Fresh Juices'}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[TYPOGRAPHY.subtext, { color: COLORS.primaryGreen, fontWeight: '700' }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              renderSkeleton()
            ) : filteredProducts.length > 0 ? (
              <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
                {filteredProducts.map((item) => (
                  item.category === 'juice' ? (
                    <DestinationCard
                      key={item.id}
                      imageUrl={item.image_url || 'https://images.unsplash.com/photo-1622597467827-4309112bba21?auto=format&fit=crop&q=80&w=400'}
                      category={item.category}
                      title={item.name}
                      price={60}
                      isLiked={likedProducts.has(item.id)}
                      onLike={() => toggleLike(item.id)}
                      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                    />
                  ) : (
                    <ProductCard
                      key={item.id}
                      name={item.name}
                      price={item.category === 'fruit' ? (item.price_per_kg || 0) : 60}
                      image={item.image_url || 'https://images.unsplash.com/photo-1622597467827-4309112bba21?auto=format&fit=crop&q=80&w=400'}
                      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                      isAvailable={item.is_available}
                      onAddToCart={() => {
                        addItem(item);
                      }}
                    />
                  )
                ))}
              </Animated.View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={TYPOGRAPHY.body}>No items found in this category.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamBackground,
  },
  mainFilterWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  mainFilterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: RADIUS.full,
    padding: 4,
  },
  mainFilterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  mainFilterBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mutedGray,
  },
  mainFilterTextActive: {
    color: COLORS.primaryGreen,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  skeletonCard: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    shadowColor: COLORS.primaryGreen,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryText: {
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
});
