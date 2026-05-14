"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Settings as SettingsIcon, 
  MapPin, 
  Navigation, 
  Globe, 
  Clock, 
  Save, 
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Dynamically import MapPicker to prevent SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/delivery/MapPicker'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">Loading Map...</div>
});

interface Settings {
  shop_latitude: number;
  shop_longitude: number;
  shop_address: string;
  max_delivery_radius: number;
  free_delivery_radius: number;
  delivery_fee: number;
  is_delivery_enabled: boolean;
}

export default function DeliverySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<Settings>({
    shop_latitude: 19.0760,
    shop_longitude: 72.8777,
    shop_address: '',
    max_delivery_radius: 5,
    free_delivery_radius: 3,
    delivery_fee: 30,
    is_delivery_enabled: true
  });

  const [isEditingMap, setIsEditingMap] = useState(false);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          shop_latitude: data.shop_latitude || 19.0760,
          shop_longitude: data.shop_longitude || 72.8777,
          shop_address: data.shop_address || '',
          max_delivery_radius: data.max_delivery_radius || 5,
          free_delivery_radius: data.free_delivery_radius || 3,
          delivery_fee: data.delivery_fee || 30,
          is_delivery_enabled: data.is_delivery_enabled ?? true
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast({ title: "Fetch Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          id: (await supabase.from('store_settings').select('id').single()).data?.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast({ title: "Settings Saved", variant: "success" });
      setIsEditingMap(false); // Lock it back after saving
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Infrastructure</h1>
            <p className="text-slate-500 font-medium font-outfit tracking-wide">Configure store location and logistics parameters</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'UPDATING...' : 'SAVE SETTINGS'}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm">
              <h3 className="text-lg font-black text-slate-900">Store GPS Location</h3>
              <button 
                onClick={() => setIsEditingMap(!isEditingMap)}
                className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", isEditingMap ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary hover:bg-primary/20")}
              >
                {isEditingMap ? 'LOCK MAP' : 'EDIT LOCATION'}
              </button>
            </div>
            <div className="card-premium p-4 h-[500px] relative overflow-hidden bg-slate-50 border-2 border-slate-100 dark:border-slate-800">
              <MapPicker 
                initialCenter={[settings.shop_latitude, settings.shop_longitude]}
                radiusKm={settings.max_delivery_radius}
                isEditable={isEditingMap}
                onLocationSelect={(lat, lng, address) => {
                  setSettings(prev => ({ 
                    ...prev, 
                    shop_latitude: lat, 
                    shop_longitude: lng,
                    shop_address: address || prev.shop_address 
                  }));
                }}
              />
              <div className="absolute top-8 left-8 z-[400] card-premium p-4 bg-white/90 backdrop-blur shadow-2xl border-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Current Coordinates</p>
                    <p className="text-xs font-black text-slate-900">{settings.shop_latitude.toFixed(4)}, {settings.shop_longitude.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium p-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Store Physical Address</h3>
              <textarea 
                value={settings.shop_address}
                onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary/20 rounded-3xl outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                rows={3}
                placeholder="Enter the full store address for customer reference..."
              />
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-8">
            <div className="card-premium p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Navigation size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Radius Control</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Delivery Radius</label>
                    <span className="text-sm font-black text-primary">{settings.max_delivery_radius} KM</span>
                  </div>
                  <input 
                    type="range" min="1" max="50" step="1"
                    value={settings.max_delivery_radius}
                    onChange={(e) => setSettings({ ...settings, max_delivery_radius: parseInt(e.target.value) })}
                    className="w-full accent-primary h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Free Delivery Radius</label>
                    <span className="text-sm font-black text-emerald-500">{settings.free_delivery_radius} KM</span>
                  </div>
                  <input 
                    type="range" min="0" max={settings.max_delivery_radius} step="1"
                    value={settings.free_delivery_radius}
                    onChange={(e) => setSettings({ ...settings, free_delivery_radius: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="card-premium p-8 bg-slate-900 text-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-black">Financials</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Base Delivery Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500 text-lg">₹</span>
                    <input 
                      type="number"
                      value={settings.delivery_fee}
                      onChange={(e) => setSettings({ ...settings, delivery_fee: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none font-black text-xl focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm">Accept Orders</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Master Delivery Switch</p>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, is_delivery_enabled: !settings.is_delivery_enabled })}
                      className={cn(
                        "w-14 h-8 rounded-full relative transition-all duration-300",
                        settings.is_delivery_enabled ? "bg-primary" : "bg-slate-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg",
                        settings.is_delivery_enabled ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
