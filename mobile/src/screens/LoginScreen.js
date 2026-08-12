import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Image,
  Dimensions,
  ScrollView,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';


const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setErrors({ submit: result.error || 'Invalid credentials. Please try again.' });
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/login-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.7)', 'rgba(0, 107, 50, 0.85)', 'rgba(15, 23, 42, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* Top Bar with Back Button */}
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                style={styles.topBar}
              >
                <TouchableOpacity 
                  onPress={() => navigation.goBack()} 
                  style={styles.backButton}
                >
                  <ArrowLeft size={22} color="#ffffff" />
                </TouchableOpacity>
              </MotiView>

              {/* Glassmorphic Form Container */}
              <MotiView
                from={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 700, delay: 200 }}
                style={styles.glassCardContainer}
              >
                {/* Fallback to semi-transparent background since expo-blur might not be configured perfectly on all devices */}
                <View style={styles.glassCard}>
                  
                  {/* Logo & Header */}
                  <View style={styles.headerSection}>
                    <View style={styles.logoWrapper}>
                      <Image
                        source={require('../../assets/UBS.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.title}>Sign In</Text>
                    <Text style={styles.subtitle}>Welcome back to your dashboard</Text>
                  </View>

                  {/* Error Banner */}
                  {errors.submit && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={styles.errorBanner}
                    >
                      <View style={styles.errorDot} />
                      <Text style={styles.errorBannerText}>{errors.submit}</Text>
                    </MotiView>
                  )}

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                    <View style={[
                      styles.inputWrapper,
                      emailFocused && styles.inputWrapperFocused,
                      errors.email && styles.inputWrapperError
                    ]}>
                      <Mail size={18} color={emailFocused ? '#facc15' : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="your_id@uhasbasic.edu.gh"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                      />
                    </View>
                    {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={[
                      styles.inputWrapper,
                      passwordFocused && styles.inputWrapperFocused,
                      errors.password && styles.inputWrapperError
                    ]}>
                      <Lock size={18} color={passwordFocused ? '#facc15' : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                        ) : (
                          <Eye size={18} color="rgba(255,255,255,0.5)" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                  </View>

                  {/* Options Row */}
                  <View style={styles.optionsRow}>
                    <View style={styles.rememberRow}>
                      <Switch
                        value={rememberMe}
                        onValueChange={setRememberMe}
                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#059669' }}
                        thumbColor={rememberMe ? '#facc15' : '#ffffff'}
                        style={styles.switch}
                      />
                      <Text style={styles.rememberText}>Remember me</Text>
                    </View>
                    <TouchableOpacity>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign In Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={styles.signInBtnShadow}
                  >
                    <LinearGradient
                      colors={loading ? ['#059669', '#059669'] : ['#facc15', '#eab308']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.signInBtn}
                    >
                      {loading ? (
                        <ActivityIndicator color="#0f172a" size="small" />
                      ) : (
                        <>
                          <LogIn size={20} color="#0f172a" />
                          <Text style={styles.signInBtnText}>Sign In to Account</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                </View>
              </MotiView>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center', // Centers the glass card vertically
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 30,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  // Glassmorphic Card
  glassCardContainer: {
    width: '100%',
    marginTop: 80, // Space for back button
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    // Optional: add backdropFilter for web if applicable, but RN uses BlurView
    // For now we rely on a strong semi-transparent background for universal support
  },
  
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logoImage: {
    width: '65%',
    height: '65%',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    gap: 10,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f87171',
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  
  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#facc15', // Brand yellow
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  fieldError: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  
  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    transform: [{ scale: 0.8 }],
    marginRight: 6,
  },
  rememberText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 13,
    color: '#facc15', // Brand yellow
    fontWeight: '800',
  },
  
  // Sign In Button
  signInBtnShadow: {
    shadowColor: '#eab308', // Brand yellow shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderRadius: 16,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a', // Dark text on yellow button
  },
});

export default LoginScreen;
