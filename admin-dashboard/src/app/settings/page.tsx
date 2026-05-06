'use client';

import React, { useState } from 'react';
import { Save, Store, Shield, Bell, Truck } from 'lucide-react';

export default function SettingsPage() {
  const [shopOpen, setShopOpen] = useState(true);
  const [minOrder, setMinOrder] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Mock save
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your shop behavior and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation - Sidebar like */}
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-50 text-[#EF4444] font-bold text-sm">
            <Store size={18} />
            <span>General Shop</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <Truck size={18} />
            <span>Delivery Rules</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <Bell size={18} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <Shield size={18} />
            <span>Security</span>
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Shop Status</p>
                <p className="text-xs text-gray-500">Enable or disable ordering for all users.</p>
              </div>
              <button 
                onClick={() => setShopOpen(!shopOpen)}
                className={`w-12 h-6 rounded-full transition-colors relative ${shopOpen ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${shopOpen ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <p className="font-bold text-gray-900 mb-4">Ordering Rules</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Minimum Order Value (₹)</label>
                  <input 
                    type="number" 
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-[#EF4444] text-white px-6 py-2.5 rounded-lg font-bold flex items-center space-x-2 hover:bg-red-600 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? <Save className="animate-pulse" size={18} /> : <Save size={18} />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
