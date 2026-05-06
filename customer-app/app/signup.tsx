import * as React from 'react';
import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Phone, ArrowRight, User, Mail, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import { Celebration } from '../src/components/ui/Celebration';
import { COLORS } from '../src/theme/tokens';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();
  const toastRef = React.useRef<ToastHandle>(null);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      return toastRef.current?.show('Please fill in all fields.', 'error');
    }
    if (password !== confirmPassword) {
      return toastRef.current?.show('Passwords do not match.', 'error');
    }
    if (password.length < 6) {
      return toastRef.current?.show('Password must be at least 6 chars.', 'error');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), phone: phone.trim() }
        }
      });

      if (error) throw error;

      if (data?.user) {
        setSignupDone(true);
      }
    } catch (err: any) {
      toastRef.current?.show(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Post-signup confirmation screen ──────────────────────────────────────
  if (signupDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <Celebration />
        
        <View style={styles.successContainer}>
          <Animated.View 
            entering={ZoomIn.duration(800).springify()}
            style={styles.successIcon}
          >
            <LinearGradient
              colors={[COLORS.primaryGreen, '#059669']}
              style={styles.iconGradient}
            >
              <Mail size={48} color={COLORS.white} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <Text style={styles.successTitle}>Check Your Email!</Text>
            
            <View style={styles.contextCard}>
              <Text style={styles.successBody}>
                We sent a verification link to:
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </View>

            <Text style={styles.successNote}>
              Tap the link in the email to verify your account, then come back to start your fresh journey.
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(600).springify()}
            style={styles.actionContainer}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.goLoginBtn}
              onPress={() => router.replace('/login')}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.goLoginGradient}>
                <Text style={styles.goLoginText}>Go to Sign In</Text>
                <ArrowRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={async () => {
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email.trim().toLowerCase(),
                  });
                  if (error) throw error;
                  toastRef.current?.show('Verification email resent!', 'success');
                } catch (e: any) {
                  toastRef.current?.show(e.message, 'error');
                }
              }}
            >
              <Text style={styles.resendText}>Didn't receive it? <Text style={{ textDecorationLine: 'underline' }}>Resend email</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fresh juices delivered to your door 🍊</Text>
          </View>

          <View style={styles.form}>
            <Field label="Full Name" icon={<User size={20} color="#94a3b8" />}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Preetham Goud"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Email Address" icon={<Mail size={20} color="#94a3b8" />}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </Field>

            <Field label="Phone Number" icon={<Phone size={20} color="#94a3b8" />}>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </Field>

            <Field label="Password" icon={<ShieldCheck size={20} color="#94a3b8" />}>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Field>

            <Field label="Confirm Password" icon={<ShieldCheck size={20} color="#94a3b8" />}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </Field>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.signupBtnContainer}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient colors={['#FF9900', '#FF6600']} style={styles.signupBtn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.signupBtnText}>Create Account</Text>
                    <ArrowRight size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: any; children: any }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },

  form: { padding: 28, marginTop: 8 },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 12,
    fontSize: 15,
    color: '#1e293b',
  },

  signupBtnContainer: {
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF7700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  signupBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#94a3b8' },
  link: { fontSize: 14, fontWeight: '800', color: '#FF7700' },

  // ── Success screen ──────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  contextCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  successBody: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  successNote: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  goLoginBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    marginBottom: 20,
  },
  goLoginGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  goLoginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  resendBtn: { paddingVertical: 12 },
  resendText: {
    fontSize: 14,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
});
