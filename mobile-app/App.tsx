import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/common/LoadingScreen';
import { theme } from './src/theme';
import { initializeNotifications } from './src/services/notificationService';
import { startLocationTracking } from './src/services/locationService';
import { initializeAnalytics } from './src/services/analyticsService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });

        // Check biometric capabilities
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (hasHardware) {
          const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          setBiometricType(biometricTypes);
        }

        // Initialize services
        await initializeNotifications();
        await initializeAnalytics();

        // Start location tracking if user has opted in
        const locationPermission = await SecureStore.getItemAsync('locationPermission');
        if (locationPermission === 'granted') {
          startLocationTracking();
        }

        // Artificially delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        console.warn('Error during app preparation:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <PaperProvider theme={theme}>
              <ThemeProvider>
                <AuthProvider biometricTypes={biometricType}>
                  <NotificationProvider>
                    <NavigationContainer>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </NavigationContainer>
                  </NotificationProvider>
                </AuthProvider>
              </ThemeProvider>
            </PaperProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}