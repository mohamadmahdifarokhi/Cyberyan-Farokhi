import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { validateName, validateEmail } from '../utils/validation';
import { ImageAsset } from '../types';
import { GradientBackground, ModernButton, ModernCard, AlertDialog } from '../components';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface RegistrationScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const { setCredentials, setJWT, addAuditLog, biometricAvailable, setBiometricEnabled, fcmToken, registerFCMToken } =
    useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passportImage, setPassportImage] = useState<ImageAsset | null>(null);
  const [selfieImage, setSelfieImage] = useState<ImageAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>(
    {},
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'info' | 'warning'>('error');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  const animateImageUpload = () => {
    imageScaleAnim.setValue(0);
    Animated.spring(imageScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const showSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      navigation.navigate('Wallet');
    });
  };
  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };
  const handleImagePicker = (type: 'passport' | 'selfie') => {
    const mockImage: ImageAsset = {
      uri: `https://placehold.co/150x150/png?text=${type}`,
      type: 'image/jpeg',
      name: `${type}.jpg`,
    };

    if (type === 'passport') {
      setPassportImage(mockImage);
    } else {
      setSelfieImage(mockImage);
    }
    animateImageUpload();
  };
  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateName(name)) {
      newErrors.name = 'Name must contain only alphanumeric characters and spaces';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.registerUser({
        name,
        email,
        password,
        passportImage: passportImage || undefined,
        selfieImage: selfieImage || undefined,
      });

      await setCredentials({
        did: response.did,
        vc: response.vc,
      });
      await setJWT(response.jwt);
      addAuditLog({
        hash: response.auditHash,
        timestamp: new Date().toISOString(),
        operation: 'credential_issuance',
      });
      if (enableBiometric && biometricAvailable) {
        await setBiometricEnabled(true);
      }
      if (fcmToken) {
        try {
          await registerFCMToken(fcmToken);
        } catch (error) {
          console.error('Failed to register FCM token:', error);
        }
      }
      showSuccessAnimation();
    } catch (error: unknown) {
      console.error('[RegistrationScreen] Registration error:', error);
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };

      console.error('[RegistrationScreen] Error response:', err?.response);
      console.error('[RegistrationScreen] Error response status:', err?.response?.status);
      console.error('[RegistrationScreen] Error response data:', err?.response?.data);
      console.error('[RegistrationScreen] Error message:', err?.message);
      const errorMessage = error?.response?.data?.error || error?.message || 'Registration failed. Please try again.';
      const isEmailDuplicate = errorMessage === 'Email already registered' || error?.response?.status === 409;

      if (isEmailDuplicate) {
        showAlert(
          'Email Already Registered',
          'This email is already registered. Please use a different email or login to your existing account.',
          'error',
        );
      } else {
        showAlert('Registration Failed', errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground variant="primary">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Create Your Digital Identity</Text>
            <Text style={styles.subtitle}>Register to receive your verifiable credential</Text>
            <ModernCard elevation="lg" padding="lg" style={styles.formCard}>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={name}
                  onChangeText={setName}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Enter your password (min 8 characters)"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.text.disabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Passport Photo</Text>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => handleImagePicker('passport')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.imageButtonText}>{passportImage ? '✓ Change Photo' : '📷 Select Photo'}</Text>
                </TouchableOpacity>
                {passportImage && (
                  <Animated.View
                    style={[
                      styles.imagePreviewContainer,
                      {
                        transform: [{ scale: imageScaleAnim }],
                      },
                    ]}
                  >
                    <Image source={{ uri: passportImage.uri }} style={styles.imagePreview} />
                  </Animated.View>
                )}
              </View>
              {}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Selfie Photo</Text>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => handleImagePicker('selfie')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.imageButtonText}>{selfieImage ? '✓ Change Photo' : '🤳 Select Photo'}</Text>
                </TouchableOpacity>
                {selfieImage && (
                  <Animated.View
                    style={[
                      styles.imagePreviewContainer,
                      {
                        transform: [{ scale: imageScaleAnim }],
                      },
                    ]}
                  >
                    <Image source={{ uri: selfieImage.uri }} style={styles.imagePreview} />
                  </Animated.View>
                )}
              </View>
              {}
              {biometricAvailable && (
                <View style={styles.biometricContainer}>
                  <TouchableOpacity
                    style={styles.biometricToggle}
                    onPress={() => setEnableBiometric(!enableBiometric)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.biometricToggleContent}>
                      <View>
                        <Text style={styles.biometricLabel}>Enable Biometric Authentication</Text>
                        <Text style={styles.biometricSubtext}>
                          Use fingerprint or face recognition to secure your app
                        </Text>
                      </View>
                      <View style={[styles.checkbox, enableBiometric && styles.checkboxChecked]}>
                        {enableBiometric && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              {}
              <ModernButton
                title={loading ? 'Processing...' : 'Register'}
                onPress={handleSubmit}
                variant="secondary"
                size="lg"
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              />
              {}
              <View style={styles.loginLinkContainer}>
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLinkText}>
                    Already have an account? <Text style={styles.loginLinkTextBold}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ModernCard>
          </Animated.View>
          {}
          {showSuccess && (
            <Animated.View
              style={[
                styles.successOverlay,
                {
                  opacity: successAnim,
                  transform: [
                    {
                      scale: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.successCard}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Success!</Text>
                <Text style={styles.successMessage}>Your credential has been issued</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {}
      <AlertDialog
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </GradientBackground>
  );
};
const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: responsive.spacing.xl,
    },
    container: {
      flex: 1,
      paddingHorizontal: responsive.spacing.lg,
    },
    title: {
      fontSize: responsive.fontSize('3xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.inverse,
      textAlign: 'center',
      marginBottom: responsive.spacing.sm,
    },
    subtitle: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.inverse,
      textAlign: 'center',
      marginBottom: responsive.spacing.xl,
      opacity: 0.9,
    },
    formCard: {
      marginTop: responsive.spacing.md,
    },
    inputContainer: {
      marginBottom: responsive.spacing.lg,
    },
    label: {
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.sm,
    },
    input: {
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
      borderRadius: theme.borderRadius.md,
      padding: responsive.spacing.md,
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.primary,
      minHeight: responsive.touchTarget,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: responsive.fontSize('xs'),
      marginTop: responsive.spacing.xs,
    },
    imageButton: {
      backgroundColor: theme.colors.primary.solid,
      padding: responsive.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      minHeight: responsive.touchTarget,
      ...theme.shadows.sm,
    },
    imageButtonText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    imagePreviewContainer: {
      marginTop: responsive.spacing.md,
      alignItems: 'center',
    },
    imagePreview: {
      width: 150,
      height: 150,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
    submitButton: {
      marginTop: responsive.spacing.lg,
    },
    loginLinkContainer: {
      marginTop: responsive.spacing.xl,
      alignItems: 'center',
    },
    loginLink: {
      padding: responsive.spacing.sm,
    },
    loginLinkText: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
    },
    loginLinkTextBold: {
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary.solid,
    },
    biometricContainer: {
      marginBottom: responsive.spacing.lg,
    },
    biometricToggle: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
      padding: responsive.spacing.md,
      minHeight: responsive.touchTarget,
    },
    biometricToggleContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    biometricLabel: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.xs,
    },
    biometricSubtext: {
      fontSize: responsive.fontSize('xs'),
      color: theme.colors.text.secondary,
      maxWidth: '80%',
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
      backgroundColor: theme.colors.surface.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary.solid,
      borderColor: theme.colors.primary.solid,
    },
    checkmark: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.bold,
    },
    successOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay.dark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.xl,
      padding: responsive.spacing['2xl'],
      alignItems: 'center',
      ...theme.shadows.xl,
    },
    successIcon: {
      fontSize: 64,
      color: theme.colors.success,
      marginBottom: responsive.spacing.md,
    },
    successTitle: {
      fontSize: responsive.fontSize('2xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.sm,
    },
    successMessage: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
