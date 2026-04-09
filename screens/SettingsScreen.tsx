import { useClerk } from '@clerk/clerk-expo';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAttendance } from '../contexts/AttendanceContext';
import { getTheme, isDarkResolved } from '../utils/theme';
import { ThemeMode } from '../utils/types';

export const SettingsScreen: React.FC = () => {
  const { signOut } = useClerk();
  const { settings, setThemeMode, resetData, simulateAutoPresent } = useAttendance();
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved(settings.themeMode, systemScheme));

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
