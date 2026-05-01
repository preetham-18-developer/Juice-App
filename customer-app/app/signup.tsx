import React, { useState } from 'react';
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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      return Alert.alert('Missing Fields', 'Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Password Mismatch', 'Passwords do not match.');
    }
    if (password.length < 6) {
      return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    }

    setLoading(true);
    let attempts = 0;
    const maxRetries = 3;

    const attemptSignUp = async (): Promise<any> => {
      attempts++;
      console.log(`[Signup] Attempt ${attempts}/${maxRetries} for:`, email.trim());

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network connection timed out.')), 15000)
        );

        const { data, error } = (await Promise.race([
          supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: { full_name: name.trim(), phone: phone.trim() }
            }
          }),
          timeoutPromise
        ])) as { data: any; error: any };

        if (error) {
          console.log("AUTH ERROR FULL:", JSON.stringify(error, null, 2));
          Alert.alert('Signup Rejected', `Message: ${error.message}\nStatus: ${error.status}\nCode: ${error.code}`);
          return;
        }

        console.log("SIGNUP SUCCESS:", data?.user?.id);

        if (data?.user && !data.session) {
          setSignupDone(true);
        }
      } catch (err: any) {
        console.log(`[Signup] Attempt ${attempts} Failed:`, err.message);
        
        if (attempts < maxRetries && (err.message.includes('Network') || err.message.includes('timed out'))) {
          console.log('[Signup] Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptSignUp();
        } else {
          Alert.alert('Network Failure', `Exhausted ${maxRetries} attempts.\nError: ${err.message}`);
        }
      }
    };

    await attemptSignUp();
    setLoading(false);
  };

  // ── Post-signup confirmation screen ──────────────────────────────────────
  if (signupDone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={72} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Check Your Email!</Text>
          <Text style={styles.successBody}>
            We sent a verification link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.successNote}>
            Tap the link in the email to verify your account, then come back and sign in.
          </Text>

          <TouchableOpacity
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
                Alert.alert('Sent!', 'Verification email resent. Please check your inbox.');
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          >
            <Text style={styles.resendText}>Didn't receive it? Resend email</Text>
          </TouchableOpacity>
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
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
  },

  form: { padding: 28, marginTop: 8 },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Outfit_600SemiBold',
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
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Outfit_700Bold',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#94a3b8' },
  link: { fontSize: 14, fontWeight: '800', color: '#FF7700', fontFamily: 'Outfit_700Bold' },

  // ── Success screen ──────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
  },
  successBody: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#059669',
    fontFamily: 'Outfit_700Bold',
  },
  successNote: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 36,
    paddingHorizontal: 12,
    fontFamily: 'Poppins_400Regular',
  },
  goLoginBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 16,
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
    fontFamily: 'Outfit_700Bold',
    fontWeight: '800',
  },
  resendBtn: { paddingVertical: 12 },
  resendText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
