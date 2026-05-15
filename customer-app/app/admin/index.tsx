import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  Text,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCcw, ExternalLink } from 'lucide-react-native';
import { COLORS } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';

export default function AdminWebView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // The "Early Morning" Premium Dashboard URL
  // We use the definitive URL provided by the user
  const ADMIN_URL = 'https://admin-dashboard-juice-u13x.vercel.app/admin/dashboard';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.darkText} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Premium Console</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>SECURE ACCESS</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        <WebView 
          source={{ uri: ADMIN_URL }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            console.error('WebView Error:', e.nativeEvent);
            setError('Failed to load the Premium Dashboard. Please check your internet connection.');
            setLoading(false);
          }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={COLORS.primaryGreen} />
              <Text style={styles.loaderText}>Syncing Premium Dashboard...</Text>
            </View>
          )}
        />
      </View>

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(null); setLoading(true); }}>
            <RefreshCcw size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF'
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.darkText },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  liveText: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2' },
  logoutText: { color: '#EF4444', fontSize: 12, fontWeight: '800' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 16, fontSize: 14, fontWeight: '700', color: '#64748B' },
  errorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { textAlign: 'center', color: '#64748B', fontWeight: '600', marginBottom: 24, lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryGreen, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '800' }
});
