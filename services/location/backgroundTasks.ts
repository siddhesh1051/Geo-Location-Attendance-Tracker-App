import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { autoMarkPresentTodayOnce, getSettings } from '../../storage/attendanceStorage';
import { GEOFENCE_TASK, LOCATION_TASK } from './constants';
import { OfficeLocation } from '../../utils/types';

/** Meters between two WGS84 points (haversine). */
const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isInsideOffice = (lat: number, lon: number, office: OfficeLocation): boolean =>
  distanceMeters(lat, lon, office.latitude, office.longitude) <= office.radius;

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

const notifyPresent = async () => {
  if (Platform.OS === 'web' || isExpoGoAndroid) return;
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
};

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const event = data as { eventType?: number };
  if (event?.eventType !== Location.GeofencingEventType.Enter) return;
  const { didMarkNow } = await autoMarkPresentTodayOnce();
  if (!didMarkNow) return;
  await notifyPresent();
});

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const payload = data as { locations?: Location.LocationObject[] };
  if (!payload?.locations?.length) return;
  const settings = await getSettings();
  const office = settings.officeLocation;
  const last = payload.locations[payload.locations.length - 1];
  const { latitude, longitude } = last.coords;
  if (!isInsideOffice(latitude, longitude, office)) return;
  const { didMarkNow } = await autoMarkPresentTodayOnce();
  if (!didMarkNow) return;
  await notifyPresent();
});
