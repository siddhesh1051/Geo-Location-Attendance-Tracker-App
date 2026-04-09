import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { AppState } from 'react-native';

import {
  applyDefaultWFHForPastWorkingDays,
  clearDayStatus,
  defaultSettings,
  getAttendance,
  getSettings,
  resetAll,
  autoMarkPresentToday,
  saveAttendance,
  saveSettings,
  setDayStatus,
} from '../storage/attendanceStorage';
import { loadAppConfig, subscribeAppConfig } from '../services/firestore/appConfigCloud';
import { loadCloudAttendance, saveCloudAttendance } from '../services/firestore/attendanceCloud';
import { toDateKey, eachDay, isWeekend, monthEnd, monthStart } from '../utils/date';
import { AppSettings, AttendanceMap, AttendanceStatus, ThemeMode } from '../utils/types';

type MonthlyStats = {
  present: number;
  wfh: number;
  leave: number;
  workingDays: number;
  effectiveWorkingDays: number;
  attendancePercent: number;
};

type AttendanceContextValue = {
  records: AttendanceMap;
  settings: AppSettings;
  loading: boolean;
  setManualStatus: (dateKey: string, status: AttendanceStatus) => Promise<void>;
  clearStatus: (dateKey: string) => Promise<void>;
  refresh: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resetData: () => Promise<void>;
  simulateAutoPresent: () => Promise<void>;
  getMonthlyStats: (month: Date) => MonthlyStats;
};

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, userId } = useAuth();
  const [records, setRecords] = useState<AttendanceMap>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef<AppSettings>(defaultSettings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const syncCloud = useCallback(
    async (nextRecords: AttendanceMap, nextSettings: AppSettings) => {
      if (!isSignedIn || !userId) return;
      await saveCloudAttendance(userId, nextRecords, nextSettings);
    },
    [isSignedIn, userId]
  );

  const refresh = useCallback(async () => {
    const [updatedRecords, updatedSettings, appConfig] = await Promise.all([
      applyDefaultWFHForPastWorkingDays(),
      getSettings(),
      loadAppConfig(),
    ]);
    setRecords(updatedRecords);
    setSettings({ ...updatedSettings, officeLocation: appConfig.officeLocation });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const [savedRecords, savedSettings, appConfig] = await Promise.all([getAttendance(), getSettings(), loadAppConfig()]);
      let nextRecords = savedRecords;
      let nextSettings: AppSettings = { ...savedSettings, officeLocation: appConfig.officeLocation };

      if (isSignedIn && userId) {
        const cloud = await loadCloudAttendance(userId);
        if (cloud) {
          nextRecords = cloud.records;
          // Merge per-user settings but keep universal officeLocation from config/app.
          nextSettings = { ...cloud.settings, officeLocation: appConfig.officeLocation };
          await Promise.all([saveAttendance(nextRecords), saveSettings(nextSettings)]);
        } else {
          await saveCloudAttendance(userId, nextRecords, nextSettings);
        }
      }

      setRecords(nextRecords);
      setSettings(nextSettings);
      await refresh();
      setLoading(false);
    };
    bootstrap();
  }, [refresh, isSignedIn, userId]);

  useEffect(() => {
    const unsubscribe = subscribeAppConfig((config) => {
      setSettings((prev) => ({ ...prev, officeLocation: config.officeLocation }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') await refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const setManualStatus = useCallback(async (dateKey: string, status: AttendanceStatus) => {
    const updated = await setDayStatus(dateKey, status, true);
    setRecords(updated);
    await syncCloud(updated, settings);
  }, [settings, syncCloud]);

  const clearStatus = useCallback(async (dateKey: string) => {
    const updated = await clearDayStatus(dateKey);
    setRecords(updated);
    await syncCloud(updated, settings);
  }, [settings, syncCloud]);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      const next: AppSettings = { ...settings, themeMode: mode };
      await saveSettings(next);
      setSettings(next);
      await syncCloud(records, next);
    },
    [settings, records, syncCloud]
  );

  const resetData = useCallback(async () => {
    await resetAll();
    setRecords({});
    setSettings(defaultSettings);
    await syncCloud({}, defaultSettings);
  }, [syncCloud]);

  const simulateAutoPresent = useCallback(async () => {
    // Simulate the same path as office-entry auto detection.
    const updated = await autoMarkPresentToday();
    setRecords(updated);
    await syncCloud(updated, settings);
  }, [settings, syncCloud]);

  const getMonthlyStats = useCallback(
    (month: Date): MonthlyStats => {
      const start = monthStart(month);
      const end = monthEnd(month);
      const days = eachDay(start, end);
      const today = new Date();
      const allowFuture =
        month.getFullYear() < today.getFullYear() ||
        (month.getFullYear() === today.getFullYear() && month.getMonth() < today.getMonth());

      const scopedDays = allowFuture ? days : days.filter((d) => d <= today);
      const summary = scopedDays.reduce(
        (acc, day) => {
          if (isWeekend(day)) return acc;
          acc.workingDays += 1;
          const key = toDateKey(day);
          const status = records[key]?.status;
          if (status === 'leave') {
            acc.leave += 1;
          } else if (status === 'wfh') {
            acc.wfh += 1;
          } else if (status === 'present') {
            acc.present += 1;
          } else if (status === 'unset') {
            // Explicitly reset/unset date remains neutral.
          } else {
            // Unmarked date remains unset by default.
          }
          return acc;
        },
        { present: 0, wfh: 0, leave: 0, workingDays: 0, effectiveWorkingDays: 0, attendancePercent: 0 }
      );

      summary.effectiveWorkingDays = Math.max(summary.workingDays - summary.leave, 0);
      summary.attendancePercent =
        summary.effectiveWorkingDays === 0
          ? 0
          : Math.round((summary.present / summary.effectiveWorkingDays) * 100);
      return summary;
    },
    [records]
  );

  const value = useMemo(
    () => ({
      records,
      settings,
      loading,
      setManualStatus,
      clearStatus,
      refresh,
      setThemeMode,
      resetData,
      simulateAutoPresent,
      getMonthlyStats,
    }),
    [records, settings, loading, setManualStatus, clearStatus, refresh, setThemeMode, resetData, simulateAutoPresent, getMonthlyStats]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = (): AttendanceContextValue => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used inside AttendanceProvider');
  return ctx;
};
