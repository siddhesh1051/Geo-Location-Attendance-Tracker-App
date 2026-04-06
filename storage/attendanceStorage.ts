import AsyncStorage from '@react-native-async-storage/async-storage';

import { OFFICE_LOCATION } from '../services/location/constants';
import { toDateKey } from '../utils/date';
import { AppSettings, AttendanceMap, AttendanceStatus } from '../utils/types';

const ATTENDANCE_KEY = 'attendance_records_v1';
const SETTINGS_KEY = 'attendance_settings_v1';

export const defaultSettings: AppSettings = {
  officeLocation: OFFICE_LOCATION,
  themeMode: 'system',
};

export const getAttendance = async (): Promise<AttendanceMap> => {
  const raw = await AsyncStorage.getItem(ATTENDANCE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AttendanceMap;
  } catch {
    return {};
  }
};

export const saveAttendance = async (records: AttendanceMap): Promise<void> => {
  await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
};

export const getSettings = async (): Promise<AppSettings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as AppSettings & { darkMode?: boolean };
    const migratedThemeMode =
      parsed.themeMode ?? (typeof parsed.darkMode === 'boolean' ? (parsed.darkMode ? 'dark' : 'light') : 'system');
    return {
      ...defaultSettings,
      ...parsed,
      themeMode: migratedThemeMode,
    };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const resetAll = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ATTENDANCE_KEY, SETTINGS_KEY]);
};

export const setDayStatus = async (
  dateKey: string,
  status: AttendanceStatus,
  manual: boolean
): Promise<AttendanceMap> => {
  const current = await getAttendance();
  current[dateKey] = { status, manual, updatedAt: new Date().toISOString() };
  await saveAttendance(current);
  return current;
};

export const clearDayStatus = async (dateKey: string): Promise<AttendanceMap> => {
  const current = await getAttendance();
  // Unset means "no manual override", so auto-detection can update it later.
  current[dateKey] = { status: 'unset', manual: false, updatedAt: new Date().toISOString() };
  await saveAttendance(current);
  return current;
};

export const autoMarkPresentToday = async (): Promise<AttendanceMap> => {
  const key = toDateKey(new Date());
  const current = await getAttendance();
  if (current[key]?.manual) return current;
  current[key] = { status: 'present', manual: false, updatedAt: new Date().toISOString() };
  await saveAttendance(current);
  return current;
};

export const applyDefaultWFHForPastWorkingDays = async (): Promise<AttendanceMap> => {
  const current = await getAttendance();
  // No implicit defaulting: empty dates stay unset until auto-detected or manually edited.
  return current;
};
