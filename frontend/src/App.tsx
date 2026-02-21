import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppProvider, useAppContext } from './context/AppContext';
import { LoginScreen } from './screens/LoginScreen';
import { RegistrationScreen } from './screens/RegistrationScreen';
import { WalletScreen } from './screens/WalletScreen';
import { AuditScreen } from './screens/AuditScreen';
import { BiometricLockScreen } from './screens/BiometricLockScreen';
import { AnalyticsDashboardScreen } from './screens/AnalyticsDashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useTheme } from './hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { suppressWebWarnings } from './utils/platform';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const TabBarBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <LinearGradient colors={isDark ? ['#1a1f2e', '#0f1419'] : ['#ffffff', '#f8f9fa']} style={StyleSheet.absoluteFill} />
);
const MainTabs: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Wallet':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Audit':
              iconName = focused ? 'file-document' : 'file-document-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary.solid,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: theme.colors.surface.primary,
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <TabBarBackground isDark={theme.colors.background.primary === '#0f1419'} />,
        headerStyle: {
          backgroundColor: theme.colors.surface.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.primary,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text.primary,
        },
        headerTintColor: theme.colors.primary.solid,
      })}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'Wallet',
          headerTitle: 'My Credentials',
        }}
      />
      <Tab.Screen
        name="Audit"
        component={AuditScreen}
        options={{
          title: 'Audit',
          headerTitle: 'Audit Logs',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsDashboardScreen}
        options={{
          title: 'Analytics',
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isAppLocked, jwt } = useAppContext();
  const theme = useTheme();
  const navigationRef = React.useRef<unknown>(null);
  const hasValidAuth = !!jwt;

  React.useEffect(() => {
    console.log('[AppNavigator] Auth state changed - hasValidAuth:', hasValidAuth);
  }, [hasValidAuth]);
  if (isAppLocked && !isAuthenticated) {
    return <BiometricLockScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: theme.colors.background.primary === '#0f1419',
        colors: {
          primary: theme.colors.primary.solid,
          background: theme.colors.background.primary,
          card: theme.colors.surface.primary,
          text: theme.colors.text.primary,
          border: theme.colors.border.primary,
          notification: theme.colors.error,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                opacity: current.progress,
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      >
        {!hasValidAuth ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegistrationScreen} />
          </>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const App: React.FC = () => {
  useEffect(() => {
    suppressWebWarnings();
  }, []);

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
};

export default App;
