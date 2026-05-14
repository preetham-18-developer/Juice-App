"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Settings as SettingsIcon,
  Navigation,
  Globe,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

interface Zone {
  id: string;
  name: string;
  min_distance: number;
  max_distance: number;
  delivery_fee: number;
  estimated_time: string;
  is_active: boolean;
}

interface StoreSettings {
  id: string;
  max_delivery_radius: number;
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const fetchZonesAndSettings = async () => {
    try {
      setLoading(true);
      const { data: zonesData } = await supabase.from('delivery_zones').select('*').order('min_distance');
      const { data: settingsData } = await supabase.from('store_settings').select('*').single();
      
      setZones(zonesData || []);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchZonesAndSettings();
  }, []);

  const addZone = async () => {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .insert([{
          name: 'New Delivery Zone',
          min_distance: 0,
          max_distance: 5,
          delivery_fee: 40,
          estimated_time: '30-45 mins'
        }]);
      if (error) throw error;
      fetchZonesAndSettings();
      toast({ title: "Zone Created", variant: "success" });
    } catch (err) {
      toast({ title: "Creation Failed", variant: "destructive" });
    }
  };

  const deleteZone = async (id: string) => {
    try {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
      setZones(zones.filter(z => z.id !== id));
      toast({ title: "Zone Deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (!mounted) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Zones</h1>
            <p className="text-slate-500 font-medium font-outfit">Define shipping rates and coverage areas</p>
          </div>
          <button 
            onClick={addZone}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus size={18} /> New Zone
          </button>
        </div>

        {/* Global Radius Settings */}
        <div className="card-premium p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Globe size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Global Coverage</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Maximum delivery distance from store</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{settings?.max_delivery_radius || 0}</span>
                <span className="text-xs font-black text-slate-400 uppercase">KM</span>
              </div>
              <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors shadow-xl">
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)
          ) : zones.map((zone) => (
            <motion.div 
              key={zone.id}
              whileHover={{ scale: 1.01 }}
              className="card-premium p-6 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Navigation size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{zone.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{zone.min_distance}km - {zone.max_distance}km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">₹{zone.delivery_fee}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Flat Fee</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{zone.estimated_time}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{zone.is_active ? 'Active Area' : 'Inactive'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Edit Zone Details
                </button>
                <button 
                  onClick={() => deleteZone(zone.id)}
                  className="px-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <MapPin size={80} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
