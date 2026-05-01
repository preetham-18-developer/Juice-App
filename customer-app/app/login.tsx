import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Diagnostic Network Tests
    fetch("https://www.google.com")
      .then(() => console.log("[Diagnostics] GOOGLE_OK"))
      .catch(e => console.log("[Diagnostics] GOOGLE_FAIL", e.message));

    fetch("https://juozeonesytttmaizdso.supabase.co")
      .then(() => console.log("[Diagnostics] SUPABASE_OK"))
      .catch(e => console.log("[Diagnostics] SUPABASE_FAIL", e.message));
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter both email and password');
    }
    
    setLoading(true);
    let attempts = 0;
    const maxRetries = 3;

    const attemptSignIn = async (): Promise<any> => {
      attempts++;
      console.log(`[Login] Attempt ${attempts}/${maxRetries} for:`, email.trim());

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network connection timed out.')), 15000)
        );

        const result = (await Promise.race([
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
          timeoutPromise
        ])) as { data: any; error: any };

        if (result.error) {
          // If it's a 400 or 500 error, don't retry, just show it
          console.log("AUTH ERROR FULL:", JSON.stringify(result.error, null, 2));
          Alert.alert('Server Error', `Message: ${result.error.message}\nStatus: ${result.error.status}\nCode: ${result.error.code}`);
          return;
        }

        console.log("LOGIN SUCCESS:", result.data.user?.email);
        Alert.alert('Success', 'Login successful!');
      } catch (err: any) {
        console.log(`[Login] Attempt ${attempts} Failed:`, err.message);
        
        if (attempts < maxRetries && (err.message.includes('Network') || err.message.includes('timed out'))) {
          console.log('[Login] Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptSignIn();
        } else {
          Alert.alert('Network Failure', `Exhausted ${maxRetries} attempts.\nError: ${err.message}`);
        }
      }
    };

    await attemptSignIn();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Nature Themed Header Background */}
          <View style={styles.headerBackground}>
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7', '#ffffff']}
              style={styles.gradientBg}
            />
            <View style={styles.leaf1}>
              <Leaf size={100} color="#bcf0da" fill="#bcf0da" style={{ transform: [{ rotate: '15deg' }] }} />
            </View>
            <View style={styles.leaf2}>
              <Leaf size={80} color="#dcfce7" fill="#dcfce7" style={{ transform: [{ rotate: '-25deg' }] }} />
            </View>
          </View>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.logoGradient}
              >
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=200' }} 
                  style={styles.logo}
                />
              </LinearGradient>
            </View>
            <Text style={styles.title}>JuiceShop</Text>
            <Text style={styles.subtitle}>Pure Nature, Spontaneous Health.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#94a3b8" />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9}
              style={styles.loginBtnContainer} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In Smoothly</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.link}>Join the Nature</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legal}>
              <Text style={styles.legalText}>Secure & Encrypted Session </Text>
              <Lock size={12} color="#cbd5e1" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: -1,
  },
  gradientBg: { width: '100%', height: '100%' },
  leaf1: { position: 'absolute', top: -20, left: -30, opacity: 0.3 },
  leaf2: { position: 'absolute', top: 100, right: -20, opacity: 0.2 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logoGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 70, height: 70, borderRadius: 35 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 32, color: '#064e3b' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#065f46', textAlign: 'center', marginTop: 8, opacity: 0.7 },
  form: { padding: 30, paddingBottom: 50 },
  inputGroup: { marginBottom: 15 },
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#374151', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, paddingVertical: 16, marginLeft: 12, fontSize: 16, color: '#111827' },
  loginBtnContainer: { marginTop: 25, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  loginBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
  loginBtnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold', marginRight: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { fontSize: 15, color: '#6b7280' },
  link: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#059669' },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  legalText: { fontSize: 12, color: '#9ca3af', marginRight: 4 },
});
