import { OfficeLocation } from '../../utils/types';

export const LOCATION_TASK = 'attendance-location-updates-task';
export const GEOFENCE_TASK = 'attendance-geofence-task';

// Replace with your real office coordinates.
// Placeholder asked:
// const OFFICE_LOCATION = { latitude: XXX, longitude: XXX, radius: 150 };
export const OFFICE_LOCATION: OfficeLocation = {
  latitude: 0,
  longitude: 0,
  radius: 150,
};
