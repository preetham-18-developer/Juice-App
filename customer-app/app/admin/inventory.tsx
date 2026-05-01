import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { CheckCircle, AlertTriangle, XCircle, Package, Edit3 } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'UNAVAILABLE';

interface Product {
  id: string;
  name: string;
  category: string;
  price_per_kg: number | null;
  stock_kg: number;
  is_available: boolean;
  stock_status?: StockStatus; // derived or manual
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const deriveStockStatus = (product: Product): StockStatus => {
  if (!product.is_available || product.stock_kg === 0) return 'UNAVAILABLE';
  if (product.stock_kg <= 10) return 'LOW_STOCK';
  return 'IN_STOCK';
};

const STOCK_CONFIG: Record<StockStatus, { color: string; bg: string; label: string; Icon: any }> = {
  IN_STOCK:    { color: '#10B981', bg: '#D1FAE5', label: 'In Stock',    Icon: CheckCircle },
  LOW_STOCK:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Low Stock',   Icon: AlertTriangle },
  UNAVAILABLE: { color: '#EF4444', bg: '#FEE2E2', label: 'Unavailable', Icon: XCircle },
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <CheckCircle size={16} color="#fff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Stock Status Control ─────────────────────────────────────────────────────

function StockControl({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: (id: string, status: StockStatus, stock: number) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [stockInput, setStockInput] = useState(String(product.stock_kg));
  const currentStatus = deriveStockStatus(product);

  const handleQuickSet = (status: StockStatus) => {
    let newStock = product.stock_kg;
    let available = true;
    if (status === 'IN_STOCK')    { newStock = Math.max(newStock, 50); available = true; }
    if (status === 'LOW_STOCK')   { newStock = 5; available = true; }
    if (status === 'UNAVAILABLE') { newStock = 0; available = false; }
    onUpdate(product.id, status, newStock);
  };

  const handleSaveStock = () => {
    const parsed = parseFloat(stockInput);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Invalid input', 'Please enter a valid stock quantity.');
      return;
    }
    const derived = deriveStockStatus({ ...product, stock_kg: parsed, is_available: parsed > 0 });
    onUpdate(product.id, derived, parsed);
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.controlRow}>
        {(['IN_STOCK', 'LOW_STOCK', 'UNAVAILABLE'] as StockStatus[]).map((status) => {
          const cfg = STOCK_CONFIG[status];
          const isActive = currentStatus === status;
          const Icon = cfg.Icon;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.stockBtn, { borderColor: cfg.color, backgroundColor: isActive ? cfg.color : '#fff' }]}
              onPress={() => !isActive && handleQuickSet(status)}
              disabled={isActive}
              activeOpacity={0.7}
            >
              <Icon size={12} color={isActive ? '#fff' : cfg.color} />
              <Text style={[styles.stockBtnText, { color: isActive ? '#fff' : cfg.color }]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.editStockBtn}
          onPress={() => { setStockInput(String(product.stock_kg)); setModalVisible(true); }}
        >
          <Edit3 size={14} color={COLORS.mutedGray} />
        </TouchableOpacity>
      </View>

      {/* Modal for editing stock value */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set Stock — {product.name}</Text>
            <Text style={styles.modalSubtitle}>
              Auto-calculates: &gt;10 kg = In Stock, ≤10 kg = Low Stock, 0 = Unavailable
            </Text>
            <TextInput
              style={styles.stockInput}
              keyboardType="numeric"
              value={stockInput}
              onChangeText={setStockInput}
              placeholder="Enter stock in kg"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveStock}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductInventoryCard({
  item,
  onUpdate,
}: {
  item: Product;
  onUpdate: (id: string, status: StockStatus, stock: number) => void;
}) {
  const status = deriveStockStatus(item);
  const cfg = STOCK_CONFIG[status];
  const Icon = cfg.Icon;
  const progress = Math.min((item.stock_kg / 50) * 100, 100); // 50 kg = full bar

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color, borderLeftWidth: 4 }]}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Icon size={13} color={cfg.color} />
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Stock quantity + progress bar */}
      <View style={styles.stockRow}>
        <View>
          <Text style={styles.stockLabel}>Available</Text>
          <Text style={[styles.stockValue, { color: cfg.color }]}>
            {item.stock_kg} <Text style={styles.stockUnit}>kg</Text>
          </Text>
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: cfg.color }]} />
          </View>
          <Text style={[styles.progressLabel, { color: cfg.color }]}>{Math.round(progress)}%</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Status control buttons */}
      <StockControl product={item} onUpdate={onUpdate} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InventoryTracking() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const fetchInventory = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_kg', { ascending: true });
      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const updateProductStock = useCallback(
    async (productId: string, status: StockStatus, stock: number) => {
      // Optimistic local update
      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, stock_kg: stock, is_available: stock > 0 } : p)
      );

      try {
        const { error } = await supabase
          .from('products')
          .update({ stock_kg: stock, is_available: stock > 0 })
          .eq('id', productId);

        if (error) {
          fetchInventory(true); // rollback
          throw error;
        }

        showToast(`✓ Stock set to "${STOCK_CONFIG[status].label}"`);
        fetchInventory(true);
      } catch (err: any) {
        Alert.alert('Update failed', err.message);
      }
    },
    [fetchInventory]
  );

  useEffect(() => { fetchInventory(); }, []);

  // Summary counts
  const inStock    = products.filter(p => deriveStockStatus(p) === 'IN_STOCK').length;
  const lowStock   = products.filter(p => deriveStockStatus(p) === 'LOW_STOCK').length;
  const unavailable = products.filter(p => deriveStockStatus(p) === 'UNAVAILABLE').length;

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{inStock}</Text>
          <Text style={styles.summaryLabel}>In Stock</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#F59E0B' }]}>{lowStock}</Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#EF4444' }]}>{unavailable}</Text>
          <Text style={styles.summaryLabel}>Unavailable</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchInventory(); }}
              colors={[COLORS.primaryGreen]}
            />
          }
          renderItem={({ item }) => (
            <ProductInventoryCard item={item} onUpdate={updateProductStock} />
          )}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Summary banner
  summaryBanner: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: COLORS.darkText,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 26, fontWeight: '900', color: '#10B981' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  list: { padding: 16, paddingBottom: 60 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  productName: { fontSize: 16, fontWeight: '800', color: COLORS.darkText },
  productCategory: {
    fontSize: 10, fontWeight: '800', color: COLORS.mutedGray,
    letterSpacing: 1, marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Stock row
  stockRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  stockLabel: { fontSize: 11, color: COLORS.mutedGray, fontWeight: '600', marginBottom: 2 },
  stockValue: { fontSize: 22, fontWeight: '900' },
  stockUnit: { fontSize: 14, fontWeight: '500', color: COLORS.mutedGray },
  progressWrap: { flex: 1, marginLeft: 20 },
  progressTrack: {
    height: 8, backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  progressLabel: { fontSize: 10, fontWeight: '800', textAlign: 'right' },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },

  // Control row
  controlRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, gap: 4,
  },
  stockBtnText: { fontSize: 10, fontWeight: '800' },
  editStockBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    width: '85%', backgroundColor: COLORS.white,
    borderRadius: 24, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.darkText, marginBottom: 6 },
  modalSubtitle: { fontSize: 12, color: COLORS.mutedGray, marginBottom: 20, lineHeight: 18 },
  stockInput: {
    backgroundColor: COLORS.lightGray, borderRadius: 12,
    padding: 14, fontSize: 18, fontWeight: '700',
    color: COLORS.darkText, marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: COLORS.lightGray, alignItems: 'center',
  },
  modalCancelText: { fontWeight: '700', color: COLORS.mutedGray },
  modalSaveBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: COLORS.primaryGreen, alignItems: 'center',
  },
  modalSaveText: { fontWeight: '700', color: '#fff' },

  // Toast
  toast: {
    position: 'absolute', bottom: 30, left: 24, right: 24,
    backgroundColor: '#1F2937', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 999,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
