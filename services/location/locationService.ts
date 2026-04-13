import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { OfficeLocation } from '../../utils/types';
import { GEOFENCE_TASK, LOCATION_TASK } from './constants';

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

export const configureNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web' || isExpoGoAndroid) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Local notifications can still work in Expo Go. We only avoid remote push registration.
  await Notifications.requestPermissionsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('attendance-status', {
      name: 'Attendance Status',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [0, 120],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

};

export const requestLocationPermissions = async (): Promise<boolean> => {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  if (Platform.OS === 'web') return true;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
};

export const startAttendanceTracking = async (office: OfficeLocation): Promise<boolean> => {
  const granted = await requestLocationPermissions();
  if (!granted) return false;

  // Expo Web doesn't support task-manager geofencing/background updates.
  if (Platform.OS === 'web') return true;

  const region: Location.LocationRegion = {
    identifier: 'office-zone',
    latitude: office.latitude,
    longitude: office.longitude,
    radius: office.radius,
    notifyOnEnter: true,
    notifyOnExit: false,
  };

  await Location.startGeofencingAsync(GEOFENCE_TASK, [region]);

  // Android foreground location updates require a persistent system notification.
  // Keep Android tracking silent by relying on geofencing only.
  if (Platform.OS !== 'android') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 120,
      deferredUpdatesDistance: 200,
      deferredUpdatesInterval: 1000 * 60 * 10,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: false,
    });
  }
  return true;
};

export const stopAttendanceTracking = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  const hasGeo = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (hasGeo) await Location.stopGeofencingAsync(GEOFENCE_TASK);

  const hasLoc = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (hasLoc) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
};
