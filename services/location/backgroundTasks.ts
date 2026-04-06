import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { autoMarkPresentToday } from '../../storage/attendanceStorage';
import { GEOFENCE_TASK, LOCATION_TASK } from './constants';

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
  await autoMarkPresentToday();
  await notifyPresent();
});

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const payload = data as { locations?: Location.LocationObject[] };
  if (!payload?.locations?.length) return;
  await autoMarkPresentToday();
});
