import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { validateEmail } from '../utils/validation';
import { GradientBackground, ModernButton, ModernCard, AlertDialog } from '../components';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface LoginScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { setJWT, setCredentials, addAuditLog } = useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  const handleLogin = async () => {
    setError('');
    setPasswordError('');
    if (!email.trim()) {
      setError('Email is required');

      return;
    }
    if (!validateEmail(email)) {
      setError('Invalid email format');

      return;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');

      return;
    }
    setLoading(true);
    try {
      const response = await apiService.authenticateUser({ email, password });

      console.log('[LoginScreen] Login response:', { hasDID: !!response.did, hasVC: !!response.vc, did: response.did });
      await setJWT(response.jwt);
      if (response.did) {
        console.log('[LoginScreen] Saving credentials for DID:', response.did);
        await setCredentials({
          did: response.did,
          vc: response.vc || {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
              id: response.did,
              name: '',
              email: email,
            },
          },
        });
        const auditLog = {
          hash: `login-${Date.now()}-${response.did.substring(0, 8)}`,
          timestamp: new Date().toISOString(),
          operation: 'credential_access',
        };

        console.log('[LoginScreen] Adding audit log:', auditLog);
        await addAuditLog(auditLog);
        console.log('[LoginScreen] Audit log added successfully');
      } else {
        console.log('[LoginScreen] No DID in response, skipping credentials and audit log');
      }
      navigation.navigate('Wallet');
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      setAlertTitle('Login Failed');
      setAlertMessage('Authentication failed. Please check your credentials and try again.');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <GradientBackground variant="primary">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your credentials</Text>
          <ModernCard elevation="lg" padding="lg" style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.text.disabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>
            <ModernButton
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              variant="secondary"
              size="lg"
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity style={styles.registerLink} onPress={handleRegister} activeOpacity={0.7}>
              <Text style={styles.registerText}>
                Don&apos;t have an account? <Text style={styles.registerTextBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </ModernCard>
        </Animated.View>
      </KeyboardAvoidingView>
      {/* Custom Alert Dialog */}
      <AlertDialog
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type="error"
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
    container: {
      flex: 1,
      justifyContent: 'center',
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
    loginButton: {
      marginTop: responsive.spacing.md,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: responsive.spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border.primary,
    },
    dividerText: {
      marginHorizontal: responsive.spacing.md,
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    registerLink: {
      alignItems: 'center',
      padding: responsive.spacing.sm,
    },
    registerText: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
    },
    registerTextBold: {
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary.solid,
    },
  });
