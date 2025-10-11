import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

// Auth Screens
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Main App Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import VehiclesScreen from '../screens/main/VehiclesScreen';
import VehicleDetailScreen from '../screens/main/VehicleDetailScreen';
import ServiceScreen from '../screens/main/ServiceScreen';
import ScheduleServiceScreen from '../screens/main/ScheduleServiceScreen';
import DocumentsScreen from '../screens/main/DocumentsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ReferralsScreen from '../screens/main/ReferralsScreen';
import FinancingScreen from '../screens/main/FinancingScreen';
import InsuranceScreen from '../screens/main/InsuranceScreen';
import MarketValueScreen from '../screens/main/MarketValueScreen';

// Component Screens
import CameraScreen from '../screens/components/CameraScreen';
import DocumentScannerScreen from '../screens/components/DocumentScannerScreen';
import QRScannerScreen from '../screens/components/QRScannerScreen';
import MapScreen from '../screens/components/MapScreen';

import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
}

// Tab Navigator Icons
function getTabBarIcon(routeName: string, focused: boolean, color: string, size: number) {
  let iconName: keyof typeof Ionicons.glyphMap;

  switch (routeName) {
    case 'Dashboard':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Vehicles':
      iconName = focused ? 'car' : 'car-outline';
      break;
    case 'Service':
      iconName = focused ? 'build' : 'build-outline';
      break;
    case 'Documents':
      iconName = focused ? 'document-text' : 'document-text-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
}

// Main Tab Navigator
function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceScreen}
        options={{ title: 'Service' }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator with Stack
function MainNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.onSurface,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Main Tab Navigation */}
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* Vehicle Related Screens */}
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title: 'Vehicle Details' }}
      />

      {/* Service Related Screens */}
      <Stack.Screen
        name="ScheduleService"
        component={ScheduleServiceScreen}
        options={{ title: 'Schedule Service' }}
      />

      {/* Settings and Profile */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />

      <Stack.Screen
        name="Referrals"
        component={ReferralsScreen}
        options={{ title: 'Referral Program' }}
      />

      {/* Financial Screens */}
      <Stack.Screen
        name="Financing"
        component={FinancingScreen}
        options={{ title: 'Financing' }}
      />

      <Stack.Screen
        name="Insurance"
        component={InsuranceScreen}
        options={{ title: 'Insurance' }}
      />

      <Stack.Screen
        name="MarketValue"
        component={MarketValueScreen}
        options={{ title: 'Market Value' }}
      />

      {/* Utility Screens */}
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ title: 'Camera', headerShown: false }}
      />

      <Stack.Screen
        name="DocumentScanner"
        component={DocumentScannerScreen}
        options={{ title: 'Scan Document' }}
      />

      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: 'QR Scanner', headerShown: false }}
      />

      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Map' }}
      />
    </Stack.Navigator>
  );
}

// Root App Navigator
export default function AppNavigator() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authState === 'authenticated' ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}