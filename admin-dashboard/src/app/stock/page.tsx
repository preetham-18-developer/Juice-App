'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Product } from '@/types';

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStock, setEditingStock] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, juice_variants(*)');
    
    if (error) console.error(error);
    else setProducts((data as unknown as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('stock-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts(false)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'juice_variants' },
        () => fetchProducts(false)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function toggleAvailability(id: string, current: boolean) {
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !current } : p));
    
    const { error } = await supabase
      .from('products')
      .update({ is_available: !current })
      .eq('id', id);
    
    if (error) {
      console.error(error);
      fetchProducts(false); // Rollback
    }
  }

  async function updateStock() {
    if (!editingStock) return;
    setIsUpdating(true);
    
    try {
      if (editingStock.category === 'fruit') {
        const { error } = await supabase
          .from('products')
          .update({ stock_kg: newStock })
          .eq('id', editingStock.id);
        if (error) throw error;
      } else {
        // Update all variants to this stock or handle individually? 
        // For simplicity, we update the first variant found or you'd need a more complex UI
        const variantId = editingStock.juice_variants?.[0]?.id;
        if (variantId) {
          const { error } = await supabase
            .from('juice_variants')
            .update({ stock_units: newStock })
            .eq('id', variantId);
          if (error) throw error;
        }
      }
      setEditingStock(null);
      fetchProducts(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-500 text-sm">Monitor and update your inventory in real-time.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price/Variant</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <Loader2 className="animate-spin inline-block text-red-500 mr-2" size={24} />
                  Synchronizing inventory...
                </td>
              </tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold shadow-sm">
                      {product.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-400">ID: {product.id.slice(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    product.category === 'juice' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    {product.category === 'fruit' ? (
                      <span className="text-sm font-bold text-gray-900">₹{product.price_per_kg}/kg</span>
                    ) : (
                      product.juice_variants?.map((v) => (
                        <span key={v.id} className="text-[10px] text-gray-600">
                          {v.variant_type === 'very_pure' ? 'Pure' : 'Normal'}: <span className="font-bold">₹{v.price}</span>
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => toggleAvailability(product.id, product.is_available)}
                      className={`flex items-center justify-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        product.is_available 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {product.is_available ? <Check size={10} /> : <X size={10} />}
                      <span>{product.is_available ? 'AVAILABLE' : 'HIDDEN'}</span>
                    </button>
                    <div className="text-[10px] text-center text-gray-500">
                      Stock: <span className="font-bold text-gray-900">
                        {product.category === 'fruit' 
                          ? `${product.stock_kg || 0} kg` 
                          : `${product.juice_variants?.[0]?.stock_units || 0} units`
                        }
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => {
                      setEditingStock(product);
                      setNewStock(product.category === 'fruit' ? (product.stock_kg || 0) : (product.juice_variants?.[0]?.stock_units || 0));
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Edit Modal */}
      {editingStock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-500 p-6 text-white">
              <h2 className="text-xl font-bold">Update Inventory</h2>
              <p className="text-red-100 text-sm">{editingStock.name}</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Current Stock ({editingStock.category === 'fruit' ? 'kg' : 'units'})
                </label>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setNewStock(s => Math.max(0, s - 5))}
                    className="w-12 h-12 rounded-xl border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 font-bold text-xl"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="flex-1 text-center text-3xl font-bold focus:outline-none"
                  />
                  <button 
                    onClick={() => setNewStock(s => s + 5)}
                    className="w-12 h-12 rounded-xl border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => setEditingStock(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={updateStock}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
