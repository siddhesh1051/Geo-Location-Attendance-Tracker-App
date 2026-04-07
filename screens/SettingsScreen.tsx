import { useClerk } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker } from 'react-native-maps';

import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { getTheme, isDarkResolved } from '../utils/theme';
import { ThemeMode } from '../utils/types';

const toDistanceMeters = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earth * c);
};

export const SettingsScreen: React.FC = () => {
  const { signOut } = useClerk();
  const { settings, setThemeMode, resetData, simulateAutoPresent } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const prevInsideRef = useRef<boolean | null>(null);

  const themeModes: Array<{ key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  useEffect(() => {
    let active = true;
    let watcher: Location.LocationSubscription | null = null;
    const pushLog = (entry: string) => {
      const stamp = new Date().toLocaleTimeString();
      setEventLog((prev) => [`${stamp} - ${entry}`, ...prev].slice(0, 20));
    };

    const startWatch = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (permission.status !== 'granted') {
        setLocationError('Foreground location permission denied.');
        setLocationReady(true);
        pushLog('Location permission denied.');
        return;
      }
      pushLog('Location watch started.');

      watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (loc) => {
          if (!active) return;
          setCurrentCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLastUpdateAt(new Date().toLocaleTimeString());
          setLocationError(null);
          setLocationReady(true);
        }
      );
    };

    startWatch().catch(() => {
      if (!active) return;
      setLocationError('Unable to start live location updates.');
      setLocationReady(true);
      pushLog('Failed to start location watch.');
    });

    return () => {
      active = false;
      watcher?.remove();
    };
  }, []);

  const distanceMeters = useMemo(() => {
    if (!currentCoords) return null;
    return toDistanceMeters(currentCoords, {
      latitude: settings.officeLocation.latitude,
      longitude: settings.officeLocation.longitude,
    });
  }, [currentCoords, settings.officeLocation.latitude, settings.officeLocation.longitude]);

  const isInsideRadius = distanceMeters !== null && distanceMeters <= settings.officeLocation.radius;

  useEffect(() => {
    if (distanceMeters === null) return;
    const nextInside = distanceMeters <= settings.officeLocation.radius;
    const previousInside = prevInsideRef.current;
    if (previousInside !== null && previousInside !== nextInside) {
      const stamp = new Date().toLocaleTimeString();
      const line = nextInside
        ? `${stamp} - Entered office radius (${distanceMeters}m)`
        : `${stamp} - Left office radius (${distanceMeters}m)`;
      setEventLog((prev) => [line, ...prev].slice(0, 20));
    }
    prevInsideRef.current = nextInside;
  }, [distanceMeters, settings.officeLocation.radius]);

  const recenterMap = () => {
    if (!currentCoords || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      400
    );
  };

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
            Alert.alert('Debug complete', 'Simulated office entry event executed.');
          }}
        >
          Debug: Simulate Office Enter
        </AppButton>
      </AppCard>

      <AppCard theme={theme} style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Location Debug</Text>
        {!locationReady ? (
          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Reading location...</Text>
        ) : locationError ? (
          <Text style={[styles.inputLabel, { color: theme.leave }]}>{locationError}</Text>
        ) : (
          <>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
              Current lat: <Text style={{ color: theme.text }}>{currentCoords?.latitude.toFixed(6)}</Text>
            </Text>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
              Current lng: <Text style={{ color: theme.text }}>{currentCoords?.longitude.toFixed(6)}</Text>
            </Text>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
              Distance to office:{' '}
              <Text style={{ color: theme.text }}>{distanceMeters === null ? '-' : `${distanceMeters} m`}</Text>
            </Text>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
              Status:{' '}
              <Text style={{ color: isInsideRadius ? theme.present : theme.leave }}>
                {isInsideRadius ? 'Inside radius' : 'Outside radius'}
              </Text>
            </Text>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
              Last update: <Text style={{ color: theme.text }}>{lastUpdateAt ?? '-'}</Text>
            </Text>

            {currentCoords ? (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                >
                  <Marker coordinate={currentCoords} title="You" />
                  <Marker
                    coordinate={{
                      latitude: settings.officeLocation.latitude,
                      longitude: settings.officeLocation.longitude,
                    }}
                    pinColor="#2563eb"
                    title="Office"
                  />
                  <Circle
                    center={{
                      latitude: settings.officeLocation.latitude,
                      longitude: settings.officeLocation.longitude,
                    }}
                    radius={settings.officeLocation.radius}
                    fillColor="rgba(37,99,235,0.15)"
                    strokeColor="rgba(37,99,235,0.75)"
                  />
                </MapView>
                <View style={styles.debugActions}>
                  <AppButton
                    theme={theme}
                    variant="ghost"
                    style={styles.actionButton}
                    leftIcon={<Ionicons name="locate-outline" size={16} color={theme.text} />}
                    onPress={recenterMap}
                  >
                    Recenter
                  </AppButton>
                  <AppButton
                    theme={theme}
                    variant="ghost"
                    style={styles.actionButton}
                    leftIcon={<Ionicons name="trash-outline" size={16} color={theme.text} />}
                    onPress={() => setEventLog([])}
                  >
                    Clear log
                  </AppButton>
                </View>
              </>
            ) : null}

            <Text style={[styles.logTitle, { color: theme.text }]}>Radius Event Log</Text>
            {eventLog.length === 0 ? (
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>
                No radius transition events yet.
              </Text>
            ) : (
              eventLog.map((row) => (
                <Text key={row} style={[styles.logRow, { color: theme.mutedText }]}>
                  {row}
                </Text>
              ))
            )}
          </>
        )}
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
  map: {
    height: 220,
    borderRadius: 12,
    marginTop: 10,
  },
  debugActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
  },
  logTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  logRow: {
    fontSize: 12,
    marginTop: 4,
  },
});
