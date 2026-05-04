import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, X, Apple, Citrus, Camera, FileText, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'fruit' | 'juice'>('fruit');
  const [price, setPrice] = useState('');
  const [purePrice, setPurePrice] = useState(''); // New for Juice
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
      // In a real app, you'd upload this to Supabase Storage here
      // For now, we'll use the local URI or a placeholder for the DB
      // since the DB expects a public URL. 
      // I'll set a placeholder if it's a local file but show the local file in the UI.
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setCategory(product.category);
      setPrice(String(product.price_per_kg || 0));
      setStock(String(product.stock_kg || 0));
      setImageUrl(product.image_url || '');
      setIsAvailable(product.is_available);
      
      // Fetch juice variants if it's a juice
      if (product.category === 'juice') {
        const { data: variants } = await supabase
          .from('juice_variants')
          .select('*')
          .eq('product_id', product.id);
        
        const normal = variants?.find(v => v.variant_type === 'normal');
        const pure = variants?.find(v => v.variant_type === 'very_pure');
        if (normal) setPrice(String(normal.price));
        if (pure) setPurePrice(String(pure.price));
      }
    } else {
      setEditingProduct(null);
      setName('');
      setCategory('fruit');
      setPrice('');
      setPurePrice('');
      setStock('');
      setImageUrl('');
      setIsAvailable(true);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      const finalImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400';

      const productData = {
        name,
        category,
        price_per_kg: category === 'fruit' ? parseFloat(price) : null,
        stock_kg: parseFloat(stock) || 0,
        image_url: finalImageUrl,
        is_available: isAvailable
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;

        if (category === 'juice') {
          // Update/Upsert variants
          await supabase.from('juice_variants').upsert([
            { product_id: editingProduct.id, variant_type: 'normal', price: parseFloat(price), size: '300ml' },
            { product_id: editingProduct.id, variant_type: 'very_pure', price: parseFloat(purePrice), size: '300ml' }
          ], { onConflict: 'product_id,variant_type' });
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;

        if (category === 'juice' && newProduct) {
          const { error: variantError } = await supabase
            .from('juice_variants')
            .insert([
              { product_id: newProduct.id, variant_type: 'normal', price: parseFloat(price), size: '300ml' },
              { product_id: newProduct.id, variant_type: 'very_pure', price: parseFloat(purePrice), size: '300ml' }
            ]);
          if (variantError) throw variantError;
        }
      }

      setModalVisible(false);
      fetchProducts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleBulkImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setLoading(true);
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      
      // Basic CSV Parser
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('item'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('cost'));
      const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('category'));

      if (nameIdx === -1 || priceIdx === -1) {
        Alert.alert("Error", "CSV must have 'Name' and 'Price' columns.");
        setLoading(false);
        return;
      }

      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(r => r.trim());
        if (row.length < 2 || !row[nameIdx]) continue;

        const pName = row[nameIdx];
        const pPrice = parseFloat(row[priceIdx]);
        const pStock = stockIdx !== -1 ? parseFloat(row[stockIdx]) : 50;
        const pType = typeIdx !== -1 ? row[typeIdx].toLowerCase() : 'fruit';

        updates.push({
          name: pName,
          category: pType.includes('juice') ? 'juice' : 'fruit',
          price_per_kg: pType.includes('juice') ? null : pPrice,
          stock_kg: pStock,
          is_available: pStock > 0,
          image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400'
        });
      }

      if (updates.length > 0) {
        const { error } = await supabase
          .from('products')
          .upsert(updates, { onConflict: 'name' });
        
        if (error) throw error;
        
        Alert.alert("Success", `Imported ${updates.length} items successfully.`);
        fetchProducts();
      }
    } catch (err: any) {
      Alert.alert("Import Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase.from('products').delete().eq('id', id);
              if (error) throw error;
              fetchProducts();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const updateProductStatus = async (product: any, type: 'in_stock' | 'unavailable' | 'low') => {
    try {
      let updateData: any = { is_available: true };
      if (type === 'unavailable') {
        updateData.is_available = false;
      } else if (type === 'low') {
        updateData.stock_kg = 1;
      } else {
        updateData.stock_kg = 50; // Reset to a healthy stock
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productMainRow}>
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category.toUpperCase()}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{item.price_per_kg || 60}</Text>
            <Text style={[
              styles.productStock, 
              !item.is_available && { color: '#FF5252', fontWeight: 'bold' },
              item.stock_kg < 2 && item.is_available && { color: '#F59E0B', fontWeight: 'bold' }
            ]}>
              {item.is_available ? `${item.stock_kg} kg` : 'NOT AVAILABLE'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
            <Edit2 size={18} color={COLORS.primaryGreen} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
            <Trash2 size={18} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusControlRow}>
        <TouchableOpacity 
          style={[styles.statusToggle, item.is_available && item.stock_kg >= 5 && styles.statusToggleActive]} 
          onPress={() => updateProductStatus(item, 'in_stock')}
        >
          <Text style={[styles.statusToggleText, item.is_available && item.stock_kg >= 5 && styles.statusToggleTextActive]}>In Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusToggle, !item.is_available && styles.statusToggleActiveErr]} 
          onPress={() => updateProductStatus(item, 'unavailable')}
        >
          <Text style={[styles.statusToggleText, !item.is_available && styles.statusToggleTextActive]}>Not Available</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusToggle, item.is_available && item.stock_kg < 5 && styles.statusToggleActiveWarn]} 
          onPress={() => updateProductStatus(item, 'low')}
        >
          <Text style={[styles.statusToggleText, item.is_available && item.stock_kg < 5 && styles.statusToggleTextActive]}>Very Less</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Catalog</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.mutedGray }]} onPress={handleBulkImport}>
            <Upload size={18} color={COLORS.white} />
            <Text style={styles.addBtnText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primaryGreen} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'New Product'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Camera size={32} color={COLORS.mutedGray} />
                    <Text style={styles.uploadText}>Upload Product Image</Text>
                    <Text style={styles.uploadSubtext}>PNG, JPG up to 5MB</Text>
                  </View>
                )}
                {imageUrl && (
                  <View style={styles.changeImageBadge}>
                    <Edit2 size={12} color={COLORS.white} />
                    <Text style={styles.changeImageText}>Change</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Product Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="e.g. Fresh Orange" 
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                <TouchableOpacity 
                  style={[styles.categoryBtn, category === 'fruit' && styles.categoryBtnActive]}
                  onPress={() => setCategory('fruit')}
                >
                  <Apple size={18} color={category === 'fruit' ? COLORS.white : COLORS.mutedGray} />
                  <Text style={[styles.categoryBtnText, category === 'fruit' && styles.categoryBtnTextActive]}>Fruit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.categoryBtn, category === 'juice' && styles.categoryBtnActive]}
                  onPress={() => setCategory('juice')}
                >
                  <Citrus size={18} color={category === 'juice' ? COLORS.white : COLORS.mutedGray} />
                  <Text style={[styles.categoryBtnText, category === 'juice' && styles.categoryBtnTextActive]}>Juice</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{category === 'fruit' ? 'Price (₹/kg)' : 'Normal Price'}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={price} 
                    onChangeText={setPrice} 
                    keyboardType="numeric" 
                    placeholder="0.00"
                  />
                </View>
                {category === 'juice' ? (
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.label}>Pure Price</Text>
                    <TextInput 
                      style={styles.input} 
                      value={purePrice} 
                      onChangeText={setPurePrice} 
                      keyboardType="numeric" 
                      placeholder="0.00"
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.label}>Stock (kg)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={stock} 
                      onChangeText={setStock} 
                      keyboardType="numeric" 
                      placeholder="0.0"
                    />
                  </View>
                )}
              </View>

              <View style={styles.availabilityRow}>
                <Text style={styles.label}>Mark as Available</Text>
                <TouchableOpacity 
                  onPress={() => setIsAvailable(!isAvailable)}
                  style={[styles.toggleBase, isAvailable ? styles.toggleOn : styles.toggleOff]}
                >
                  <View style={[styles.toggleCircle, isAvailable ? styles.circleOn : styles.circleOff]} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Product</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  productMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  statusControlRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  statusToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  statusToggleActive: {
    backgroundColor: COLORS.primaryGreen,
  },
  statusToggleActiveErr: {
    backgroundColor: '#FF5252',
  },
  statusToggleActiveWarn: {
    backgroundColor: '#F59E0B',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mutedGray,
  },
  statusToggleTextActive: {
    color: COLORS.white,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  productCategory: {
    fontSize: 10,
    color: COLORS.mutedGray,
    fontWeight: '700',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  productStock: {
    fontSize: 12,
    color: COLORS.mutedGray,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  form: {
    flex: 1,
  },
  imageUploadArea: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightGray,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  uploadSubtext: {
    fontSize: 12,
    color: COLORS.mutedGray,
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.darkText,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    gap: 8,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primaryGreen,
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mutedGray,
  },
  categoryBtnTextActive: {
    color: COLORS.white,
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  toggleBase: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 4,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.primaryGreen },
  toggleOff: { backgroundColor: '#cbd5e1' },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  circleOn: { alignSelf: 'flex-end' },
  circleOff: { alignSelf: 'flex-start' },
});
