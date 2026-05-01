'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Product } from '@/types';

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    let isMounted = true;

    async function initialFetch() {
      const { data, error } = await supabase
        .from('products')
        .select('*, juice_variants(*)');
      
      if (isMounted) {
        if (error) console.error(error);
        else setProducts((data as unknown as Product[]) || []);
        setLoading(false);
      }
    }

    initialFetch();

    return () => { isMounted = false; };
  }, []);

  async function toggleAvailability(id: string, current: boolean) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !current })
      .eq('id', id);
    
    if (!error) fetchProducts();
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
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin inline-block text-red-500 mr-2" />
                  Loading inventory...
                </td>
              </tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">
                      {product.name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{product.category}</td>
                <td className="px-6 py-4">
                  {product.category === 'fruit' ? (
                    <span className="text-sm font-semibold text-gray-900">₹{product.price_per_kg}/kg</span>
                  ) : (
                    <div className="flex flex-col space-y-1">
                      {product.juice_variants?.map((v) => (
                        <span key={v.id} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {v.variant_type === 'very_pure' ? 'Pure' : 'Normal'}: ₹{v.price}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleAvailability(product.id, product.is_available)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                      product.is_available 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.is_available ? <Check size={12} /> : <X size={12} />}
                    <span>{product.is_available ? 'AVAILABLE' : 'OUT OF STOCK'}</span>
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
