import 'react-native-reanimated';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ClerkLoaded, ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AttendanceProvider, useAttendance } from './contexts/AttendanceContext';
import { AuthScreen } from './screens/auth/AuthScreen';
import { AppSplash } from './components/AppSplash';
import { configureNotifications, startAttendanceTracking } from './services/location/locationService';
import { CalendarScreen } from './screens/CalendarScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { clerkPublishableKey, isClerkConfigured } from './services/auth/clerkConfig';
import { tokenCache } from './services/auth/tokenCache';
import { getTheme, isDarkResolved } from './utils/theme';
import './services/location/backgroundTasks';

const Tab = createBottomTabNavigator();

const RootTabs = () => {
  const { loading, settings } = useAttendance();
  const systemScheme = useColorScheme();
  const isDark = isDarkResolved(settings.themeMode, systemScheme);
  const theme = getTheme(isDark);
  const trackingSignature = useMemo(
    () =>
      `${settings.officeLocation.latitude}:${settings.officeLocation.longitude}:${settings.officeLocation.radius}`,
    [settings.officeLocation.latitude, settings.officeLocation.longitude, settings.officeLocation.radius]
  );
  const lastTrackingSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    if (lastTrackingSignatureRef.current === trackingSignature) return;
    lastTrackingSignatureRef.current = trackingSignature;
    startAttendanceTracking(settings.officeLocation);
  }, [settings.officeLocation, trackingSignature]);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.text} />
        <Text style={[styles.loaderText, { color: theme.mutedText }]}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          sceneStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: theme.text, fontWeight: '700' },
          tabBarStyle: {
            borderTopColor: theme.border,
            backgroundColor: theme.tabBarBackground,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: theme.text,
          tabBarInactiveTintColor: theme.mutedText,
          freezeOnBlur: true,
          tabBarIcon: ({ color, size, focused }) => {
            const name =
              route.name === 'Home'
                ? focused
                  ? 'home'
                  : 'home-outline'
                : route.name === 'Calendar'
                  ? focused
                    ? 'calendar'
                    : 'calendar-outline'
                  : focused
                    ? 'settings'
                    : 'settings-outline';
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <AppSplash />;

  if (!isClerkConfigured) {
    return (
      <View style={styles.noKeyContainer}>
        <Text style={styles.noKeyTitle}>Clerk key missing</Text>
        <Text style={styles.noKeyText}>
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env to enable Google login.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SignedIn>
          <AttendanceProvider>
            <RootTabs />
          </AttendanceProvider>
        </SignedIn>
        <SignedOut>
          <AuthScreen />
        </SignedOut>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {},
  noKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#111',
  },
  noKeyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  noKeyText: {
    marginTop: 8,
    color: '#cfcfcf',
    textAlign: 'center',
  },
});
