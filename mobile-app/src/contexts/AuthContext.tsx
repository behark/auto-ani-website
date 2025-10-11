import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

import { authService } from '../services/authService';
import { User, AuthState } from '../types/auth';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  signIn: (email: string, password: string, totpCode?: string) => Promise<void>;
  signUp: (userData: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  referralCode?: string;
  agreedToMarketing?: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
  biometricTypes: LocalAuthentication.AuthenticationType[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  biometricTypes
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const biometricAvailable = biometricTypes.length > 0;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState('loading');

      // Check if user has stored credentials
      const token = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      const biometricSetting = await SecureStore.getItemAsync('biometricEnabled');

      if (token && storedUser) {
        // Verify token is still valid
        try {
          const userData = JSON.parse(storedUser);
          const response = await authService.verifyToken(token);

          if (response.valid) {
            setUser(userData);
            setAuthState('authenticated');
          } else {
            // Token expired, try to refresh
            await refreshToken();
          }
        } catch (error) {
          console.log('Token verification failed:', error);
          await signOut();
        }
      } else {
        setAuthState('unauthenticated');
      }

      setBiometricEnabled(biometricSetting === 'true');
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState('unauthenticated');
    }
  };

  const signIn = async (email: string, password: string, totpCode?: string) => {
    try {
      setAuthState('loading');

      const response = await authService.signIn({
        email,
        password,
        totpCode,
      });

      // Store credentials securely
      await SecureStore.setItemAsync('authToken', response.token);
      await SecureStore.setItemAsync('refreshToken', response.refreshToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.user));

      // Store biometric credentials if enabled
      if (biometricEnabled && biometricAvailable) {
        await SecureStore.setItemAsync('biometricCredentials', JSON.stringify({
          email,
          password,
        }));
      }

      setUser(response.user);
      setAuthState('authenticated');
    } catch (error: any) {
      setAuthState('unauthenticated');
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signUp = async (userData: RegisterData) => {
    try {
      setAuthState('loading');

      const response = await authService.signUp(userData);

      // Auto sign in after successful registration
      await signIn(userData.email, userData.password);
    } catch (error: any) {
      setAuthState('unauthenticated');
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const signOut = async () => {
    try {
      // Clear stored data
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('biometricCredentials');

      // Notify server
      try {
        await authService.signOut();
      } catch (error) {
        // Ignore server errors during sign out
      }

      setUser(null);
      setAuthState('unauthenticated');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);

      // Update stored tokens
      await SecureStore.setItemAsync('authToken', response.token);
      await SecureStore.setItemAsync('refreshToken', response.refreshToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.user));

      setUser(response.user);
      setAuthState('authenticated');
    } catch (error) {
      console.error('Token refresh failed:', error);
      await signOut();
    }
  };

  const enableBiometric = async () => {
    try {
      if (!biometricAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          'Biometric Not Set Up',
          'Please set up biometric authentication in your device settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Authenticate to enable biometric
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use password instead',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometricEnabled', 'true');
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  };

  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync('biometricEnabled');
      await SecureStore.deleteItemAsync('biometricCredentials');
      setBiometricEnabled(false);
    } catch (error) {
      console.error('Disable biometric error:', error);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (!biometricEnabled || !biometricAvailable) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometric authentication',
        fallbackLabel: 'Use password instead',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Get stored credentials
        const credentials = await SecureStore.getItemAsync('biometricCredentials');

        if (credentials) {
          const { email, password } = JSON.parse(credentials);
          await signIn(email, password);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    authState,
    biometricAvailable,
    biometricEnabled,
    signIn,
    signUp,
    signOut,
    refreshToken,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};