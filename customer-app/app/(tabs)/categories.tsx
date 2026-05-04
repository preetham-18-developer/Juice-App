import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/theme/tokens';
import { Apple, Bean, Citrus, Leaf, ChevronRight, Search, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { 
    id: 'fruit', 
    name: 'Fresh Fruits', 
    desc: 'Seasonal & Organic fruits', 
    icon: <Apple size={24} color="#FF7700" />,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600',
    tag: 'FARM FRESH'
  },
  { 
    id: 'juice', 
    name: 'Pure Juices', 
    desc: 'Cold-pressed & Sugar-free', 
    icon: <Bean size={24} color="#2E7D32" />,
    image: 'https://images.unsplash.com/photo-1622597467827-4309112bba21?w=600',
    tag: '100% PURE'
  },
  { 
    id: 'organic', 
    name: 'Organic Greens', 
    desc: 'Farm to table freshness', 
    icon: <Leaf size={24} color="#059669" />,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
    tag: 'ECO FRIENDLY'
  },
  { 
    id: 'mixed', 
    name: 'Mixed Juices', 
    desc: 'Power-packed combinations', 
    icon: <Sparkles size={24} color="#8B5CF6" />,
    image: 'https://images.unsplash.com/photo-1525904097882-44f59830c3ed?w=600',
    tag: 'BEST FOR HEALTH'
  }
];

export default function CategoriesScreen() {
  const router = useRouter();

  const handleCategoryPress = (id: string) => {
    router.push({ pathname: '/(tabs)', params: { category: id } });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>By Categories</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)')}>
            <Search size={22} color={COLORS.darkText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.promoContainer}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={styles.promoCard}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <View style={styles.promoTextContent}>
                <View style={styles.promoBadge}>
                  <Sparkles size={12} color="#FBD38D" fill="#FBD38D" />
                  <Text style={styles.promoBadgeText}>LIMITED TIME</Text>
                </View>
                <Text style={styles.promoTitle}>Summer Harvest</Text>
                <Text style={styles.promoSubtitle}>Up to 40% off on all seasonal berries and cold-pressed juices.</Text>
                <TouchableOpacity style={styles.promoBtn} onPress={() => handleCategoryPress('all')}>
                  <Text style={styles.promoBtnText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
              <Citrus color="rgba(255,255,255,0.1)" size={120} style={styles.bgIcon} />
            </LinearGradient>
          </View>

          <View style={styles.grid}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item.id)}
                activeOpacity={0.95}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                  style={styles.cardOverlay}
                />
                
                <View style={styles.cardHeader}>
                   <View style={styles.tagContainer}>
                      <BlurView intensity={60} tint="light" style={styles.blurTag}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </BlurView>
                   </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.iconCircle}>
                    {item.icon}
                  </View>
                  <View style={styles.footerText}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryDesc}>{item.desc}</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <ChevronRight size={20} color={COLORS.white} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.creamBackground },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 20
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.darkText, letterSpacing: -1 },
  headerSubtitle: { fontSize: 18, color: COLORS.mutedGray, marginTop: -4, fontWeight: '600' },
  searchBtn: { 
    padding: 12, 
    backgroundColor: COLORS.white, 
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  scrollContent: { paddingBottom: 40 },
  promoContainer: { paddingHorizontal: 24, marginBottom: 32 },
  promoCard: { 
    padding: 28, 
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden'
  },
  bgIcon: { position: 'absolute', right: -20, bottom: -20 },
  promoTextContent: { zIndex: 1 },
  promoBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(251, 211, 141, 0.2)', 
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12
  },
  promoBadgeText: { color: '#FBD38D', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  promoTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  promoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 20, maxWidth: '80%' },
  promoBtn: { 
    backgroundColor: COLORS.white, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 12, 
    marginTop: 20 
  },
  promoBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  grid: { paddingHorizontal: 24, gap: 24 },
  categoryCard: { 
    height: 220, 
    borderRadius: 32, 
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 }
    })
  },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardHeader: { padding: 20 },
  tagContainer: { 
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  blurTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: COLORS.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardFooter: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconCircle: { 
    padding: 12, 
    borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  footerText: { flex: 1, marginLeft: 16 },
  categoryName: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  categoryDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },
  arrowCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
