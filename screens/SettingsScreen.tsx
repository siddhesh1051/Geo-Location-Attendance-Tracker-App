import { useClerk } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { getTheme, isDarkResolved } from '../utils/theme';
import { ThemeMode } from '../utils/types';

const toRadians = (value: number): number => (value * Math.PI) / 180;

const calculateDistanceInMeters = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number => {
  const earthRadius = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

export const SettingsScreen: React.FC = () => {
  const { signOut } = useClerk();
  const { settings, setThemeMode, resetData, simulateAutoPresent } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState<boolean>(false);

  const updateDistanceFromCoords = useCallback(
    (latitude: number, longitude: number) => {
      const meters = calculateDistanceInMeters(
        { latitude, longitude },
        {
          latitude: settings.officeLocation.latitude,
          longitude: settings.officeLocation.longitude,
        }
      );
      setDistanceMeters(meters);
    },
    [settings.officeLocation.latitude, settings.officeLocation.longitude]
  );

  const loadDistance = useCallback(async () => {
    setDistanceLoading(true);
    setDistanceError(null);
    try {
      if (Platform.OS === 'web') {
        throw new Error('Distance is not available on web.');
      }
      const permissions = await Location.requestForegroundPermissionsAsync();
      if (permissions.status !== 'granted') {
        throw new Error('Location permission is required to show distance.');
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      updateDistanceFromCoords(current.coords.latitude, current.coords.longitude);
    } catch (error) {
      setDistanceMeters(null);
      setDistanceError(error instanceof Error ? error.message : 'Unable to compute distance');
    } finally {
      setDistanceLoading(false);
    }
  }, [updateDistanceFromCoords]);

  useEffect(() => {
    loadDistance();
  }, [loadDistance]);

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        if (Platform.OS === 'web') return;
        const permissions = await Location.requestForegroundPermissionsAsync();
        if (permissions.status !== 'granted') return;
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 4000,
            distanceInterval: 5,
          },
          (position) => {
            if (!mounted) return;
            setDistanceLoading(false);
            setDistanceError(null);
            updateDistanceFromCoords(position.coords.latitude, position.coords.longitude);
          }
        );
      } catch (error) {
        if (!mounted) return;
        setDistanceError(error instanceof Error ? error.message : 'Unable to track location in real time');
      }
    };

    startWatching();
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [updateDistanceFromCoords]);

  const distanceText = useMemo(() => {
    if (distanceLoading) return 'Calculating...';
    if (distanceError) return distanceError;
    if (distanceMeters === null) return '-';
    return formatDistance(distanceMeters);
  }, [distanceError, distanceLoading, distanceMeters]);

  const themeModes: Array<{ key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppCard theme={theme}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Office Location (Admin managed)</Text>
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          Latitude: <Text style={{ color: theme.text }}>{settings.officeLocation.latitude}</Text>
        </Text>
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          Longitude: <Text style={{ color: theme.text }}>{settings.officeLocation.longitude}</Text>
        </Text>
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          Radius (m): <Text style={{ color: theme.text }}>{settings.officeLocation.radius}</Text>
        </Text>
        <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
          Distance from current location:{' '}
          <Text style={{ color: distanceError ? theme.leave : theme.text }}>{distanceText}</Text>
        </Text>
        <Pressable onPress={loadDistance} style={styles.distanceRefreshButton}>
          <Text style={[styles.distanceRefreshText, { color: theme.text }]}>Refresh distance</Text>
        </Pressable>
      </AppCard>

      <AppCard theme={theme} style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
        <View style={[styles.themeSegment, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
          {themeModes.map((mode) => {
            const active = settings.themeMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                onPress={() => setThemeMode(mode.key)}
                style={[
                  styles.themeOption,
                  active && { backgroundColor: theme.buttonPrimaryBackground },
                ]}
              >
                <Ionicons
                  name={mode.icon}
                  size={14}
                  color={active ? theme.buttonPrimaryText : theme.mutedText}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: active ? theme.buttonPrimaryText : theme.text },
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          style={styles.resetButton}
          theme={theme}
          variant="danger"
          leftIcon={<Ionicons name="trash-outline" size={16} color={theme.buttonPrimaryText} />}
          onPress={() =>
            Alert.alert('Reset all data?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                  await resetData();
                  Alert.alert('Done', 'Attendance data reset.');
                },
              },
            ])
          }
        >
          Reset Data
        </AppButton>
        <AppButton
          style={styles.logoutButton}
          theme={theme}
          variant="ghost"
          leftIcon={<Ionicons name="log-out-outline" size={16} color={theme.text} />}
          onPress={async () => {
            await signOut();
          }}
        >
          Logout
        </AppButton>
        <AppButton
          style={styles.debugButton}
          theme={theme}
          variant="ghost"
          leftIcon={<Ionicons name="flask-outline" size={16} color={theme.text} />}
          onPress={async () => {
            await simulateAutoPresent();
            try {
              if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('attendance-status', {
                  name: 'Attendance Status',
                  importance: Notifications.AndroidImportance.DEFAULT,
                });
              }
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Attendance Updated',
                  body: 'You are marked Present for today.',
                  data: {
                    type: 'attendance_marked',
                  },
                },
                trigger: {
                  channelId: 'attendance-status',
                  seconds: 1,
                },
              });
            } catch {
              // Ignore notification errors in unsupported runtimes.
            }
            Alert.alert('Debug complete', 'Simulated office entry event executed.');
          }}
        >
          Debug: Simulate Office Enter
        </AppButton>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 2,
  },
  distanceRefreshButton: {
    marginTop: 4,
    marginLeft: 2,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  distanceRefreshText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    marginTop: 12,
  },
  themeSegment: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  themeOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 10,
  },
  debugButton: {
    marginTop: 10,
  },
});
