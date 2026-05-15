import * as React from 'react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { Toast, ToastHandle } from '../../src/components/ui/Toast';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useProducts } from '../../src/hooks/useProducts';
import { ShoppingBag, Apple, Bean, Citrus, Leaf, X } from 'lucide-react-native';
import { useDebounce } from '../../src/hooks/useDebounce';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store/useCartStore';
import { ProductService } from '../../src/services/ProductService';
import { Product } from '../../src/types';
import { COLORS } from '../../src/theme/colors';
import { TYPOGRAPHY } from '../../src/theme/typography';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Citrus, color: '#F0FDF4', borderColor: '#DCFCE7' },
  { id: 'fruit', label: 'Fruits', icon: Apple, color: '#FFF7ED', borderColor: '#FFEDD5' },
  { id: 'juice', label: 'Juices', icon: Bean, color: '#EFF6FF', borderColor: '#DBEAFE' },
  { id: 'vegetable', label: 'Vegetables', icon: Leaf, color: '#F0FDF4', borderColor: '#DCFCE7' },
  { id: 'other', label: 'Others', icon: Citrus, color: '#F8FAFC', borderColor: '#F1F5F9' },
];

export default function HomeScreen() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const isDeliverable = useCartStore((state) => state.isDeliverable);
  const toastRef = useRef<ToastHandle>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { products, loading, refreshing, error, hasMore, loadMore, refresh } = useProducts({
    category: activeCategory,
    search: debouncedSearch
  });
  
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = useMemo(() => windowWidth >= 1024 ? 3 : 2, [windowWidth]);
  const gridGap = 16;
  const horizontalPadding = windowWidth > 768 ? 32 : 16;
  const cardWidth = Math.max(120, (Math.min(windowWidth, 1400) - (horizontalPadding * 2) - (gridGap * (numColumns - 1))) / numColumns);
  
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [selectedSort, setSelectedSort] = useState<'none' | 'price_low' | 'price_high' | 'popular'>('popular');

  const filteredProducts = useMemo(() => {
    let result = [...products].filter(p => {
      const price = p.price || p.price_per_kg || 0;
      return price <= priceRange;
    });

    if (selectedSort === 'price_low') {
      result.sort((a, b) => (a.price || a.price_per_kg || 0) - (b.price || b.price_per_kg || 0));
    } else if (selectedSort === 'price_high') {
      result.sort((a, b) => (b.price || b.price_per_kg || 0) - (a.price || a.price_per_kg || 0));
    } else if (selectedSort === 'popular') {
      result.sort((a, b) => {
        if (a.is_available && !b.is_available) return -1;
        if (!a.is_available && b.is_available) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
    }
    return result;
  }, [products, priceRange, selectedSort]);

  const handleAddToCart = useCallback((item: Product) => {
    addItem(item);
    toastRef.current?.show(`${item.name} added! 🧺`, 'success');
  }, [addItem]);

  const renderSkeleton = useCallback(() => (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: cardWidth, marginBottom: 24 }}>
          <SkeletonLoader width="100%" height={180} borderRadius={28} />
          <View style={{ marginTop: 12, gap: 8 }}>
            <SkeletonLoader width="70%" height={20} />
            <SkeletonLoader width="40%" height={15} />
          </View>
        </View>
      ))}
    </View>
  ), [cardWidth]);

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View style={{ width: cardWidth, flexShrink: 0 }}>
      <PremiumCard
        id={item.id}
        index={index}
        title={item.name}
        subtitle={item.description}
        price={ProductService.getPrice(item)}
        imageUrl={ProductService.getOptimizedImage(item.image_url, 400)}
        category={item.category}
        isAvailable={item.is_available !== false}
        isDeliverable={isDeliverable}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        onAddToCart={() => handleAddToCart(item)}
        isSearching={!!searchQuery}
      />
    </View>
  ), [cardWidth, isDeliverable, router, handleAddToCart, searchQuery]);

  const ListHeader = useMemo(() => {
    if (searchQuery) return null;
    return (
      <View style={{ marginBottom: 24 }}>
        {/* Premium Promo Banner */}
        <View style={styles.bannerContainer}>
          <ExpoImage 
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=70' }} 
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>NEW ARRIVALS</Text>
            </View>
            <Text style={styles.bannerTitle}>Stock up on{"\n"}daily essentials</Text>
            <Text style={styles.bannerSubtitle}>Get farm-fresh goodness delivered in mins</Text>
            <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.8}>
              <Text style={styles.bannerBtnText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={[
                  styles.categoryBox, 
                  { backgroundColor: cat.color, borderColor: cat.borderColor },
                  isActive ? { borderWidth: 2, borderColor: COLORS.primaryGreen } : null
                ]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconBg}>
                  <Icon 
                    color={isActive ? COLORS.primaryGreen : COLORS.darkText}
                    size={28}
                  />
                </View>
                <Text style={[
                  styles.categoryLabel, 
                  isActive ? { color: COLORS.primaryGreen, fontWeight: '900' } : null
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={TYPOGRAPHY.h2}>
              {activeCategory === 'all' ? 'Fresh for You' : `${activeCategory.charAt(0).toUpperCase()}${activeCategory.slice(1)}s`}
            </Text>
            <Text style={styles.subtitleText}>Hand-picked daily harvest</Text>
          </View>
        </View>
      </View>
    );
  }, [searchQuery, activeCategory]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        onFilterPress={() => setFilterVisible(true)}
      />
      <Toast ref={toastRef} />
      
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={`grid-${numColumns}`}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        columnWrapperStyle={numColumns > 1 ? { gap: gridGap } : undefined}
        onRefresh={refresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        
        // ULTIMATE PERFORMANCE SETTINGS
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(_, index) => ({
          length: 280, 
          offset: 280 * Math.floor(index / numColumns),
          index,
        })}
        ListEmptyComponent={loading ? renderSkeleton : (
          <EmptyState 
            icon={ShoppingBag} 
            title="No matches found" 
            subtitle="Try adjusting your filters or search query." 
            actionLabel="View All Products"
            onAction={() => setActiveCategory('all')}
          />
        )}
        ListFooterComponent={hasMore && products.length > 0 ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator color={COLORS.primaryGreen} />
          </View>
        ) : null}
      />

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <X size={24} color={COLORS.darkText} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { id: 'popular', label: 'Most Popular' },
                  { id: 'price_low', label: 'Lowest Price' },
                  { id: 'price_high', label: 'Highest Price' },
                ].map(opt => (
                  <TouchableOpacity 
                    key={opt.id}
                    style={[styles.sortBtn, selectedSort === opt.id && styles.sortBtnActive]}
                    onPress={() => setSelectedSort(opt.id as 'popular' | 'price_low' | 'price_high')}
                  >
                    <Text style={[styles.sortText, selectedSort === opt.id && styles.sortTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Max Price: ₹{priceRange}</Text>
              <View style={styles.priceGrid}>
                {[100, 200, 300, 500, 1000].map(max => (
                  <TouchableOpacity 
                    key={max}
                    style={[styles.priceBtn, priceRange === max && styles.priceBtnActive]}
                    onPress={() => setPriceRange(max)}
                  >
                    <Text style={[styles.priceText, priceRange === max && styles.priceTextActive]}>
                      ₹{max}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => setFilterVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  scrollContent: { 
    width: '100%',
    paddingBottom: 40,
    paddingTop: width >= 768 ? 100 : 180, 
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryGreen,
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(0,0,0,0.15)' } as any,
      default: {
        elevation: 10,
        shadowColor: COLORS.primaryGreen,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      }
    })
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  bannerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 32,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 20,
    maxWidth: '80%',
  },
  bannerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: COLORS.primaryGreen,
    fontWeight: '900',
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
    justifyContent: 'center'
  },
  categoryBox: {
    width: (width - 32 - 24) / 3,
    maxWidth: 120,
    height: 110,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 4,
  },
  categoryIconBg: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkText,
    textAlign: 'center',
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingHorizontal: 16, 
    marginTop: 32,
    marginBottom: 16
  },
  subtitleText: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginTop: 2, 
    fontWeight: '600' 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16,
    gap: 16
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  filterSection: { marginBottom: 32 },
  filterLabel: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    marginBottom: 18 
  },
  sortOptions: { gap: 12 },
  sortBtn: { padding: 18, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  sortBtnActive: { backgroundColor: '#F0FDF4', borderColor: '#2E7D32' },
  sortText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },
  sortTextActive: { color: '#2E7D32' },
  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  priceBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 16, 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  priceBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#E67E22' },
  priceText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },
  priceTextActive: { color: '#E67E22' },
  applyBtn: { 
    backgroundColor: '#2E7D32', 
    paddingVertical: 20, 
    borderRadius: 22, 
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  applyBtnText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '900' 
  }
});
