import { doc, getDoc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';

import { OFFICE_LOCATION } from '../location/constants';
import { firestore } from '../firebase/firebase';
import { OfficeLocation } from '../../utils/types';

type AppConfig = {
  officeLocation: OfficeLocation;
  updatedAt?: unknown;
};

const configRef = doc(firestore, 'config', 'app');

type OfficeLocationRaw = {
  latitude?: number;
  longitude?: number;
  radius?: number;
  point?: { latitude?: number; longitude?: number };
  geopoint?: { latitude?: number; longitude?: number };
  location?: unknown;
  lat?: number | string;
  lng?: number | string;
  long?: number | string;
  officeRadius?: number | string;
  rad?: number | string;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeOfficeLocation = (
  raw?: unknown,
  fallbackRadius?: number
): OfficeLocation => {
  if (!raw) return OFFICE_LOCATION;
  const candidate = raw as OfficeLocationRaw;
  const point = (candidate.point ?? candidate.geopoint ?? candidate.location ?? {}) as {
    latitude?: unknown;
    longitude?: unknown;
    _latitude?: unknown;
    _longitude?: unknown;
    _lat?: unknown;
    _long?: unknown;
    lat?: unknown;
    lng?: unknown;
    long?: unknown;
  };

  const lat =
    toNumber(point.latitude) ??
    toNumber(point._latitude) ??
    toNumber(point._lat) ??
    toNumber(point.lat) ??
    toNumber(candidate.latitude) ??
    toNumber((candidate as Record<string, unknown>)._latitude) ??
    toNumber(candidate.lat);
  const lng =
    toNumber(point.longitude) ??
    toNumber(point._longitude) ??
    toNumber(point._long) ??
    toNumber(point.lng) ??
    toNumber(point.long) ??
    toNumber(candidate.longitude) ??
    toNumber((candidate as Record<string, unknown>)._longitude) ??
    toNumber(candidate.lng) ??
    toNumber(candidate.long);
  const radius =
    toNumber(candidate.radius) ??
    toNumber(candidate.officeRadius) ??
    toNumber(candidate.rad) ??
    toNumber(fallbackRadius) ??
    OFFICE_LOCATION.radius;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return OFFICE_LOCATION;
  }
  return { latitude: lat, longitude: lng, radius };
};

export const loadAppConfig = async (): Promise<AppConfig> => {
  try {
    // Prefer server value so admin-portal updates reflect immediately in the app.
    const snapshot = await getDocFromServer(configRef).catch(() => getDoc(configRef));
    if (!snapshot.exists()) {
      // Initialize with local placeholder to avoid app crash.
      const initial: AppConfig = { officeLocation: OFFICE_LOCATION, updatedAt: serverTimestamp() };
      await setDoc(configRef, initial, { merge: true });
      return initial;
    }
    const data = snapshot.data() as Partial<AppConfig> & {
      officeLocation?: unknown;
      location?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      lat?: unknown;
      lng?: unknown;
      long?: unknown;
      radius?: number;
      officeRadius?: number;
    };
    const mergedRootCandidate = {
      latitude: data.latitude ?? data.lat,
      longitude: data.longitude ?? data.lng ?? data.long,
      radius: data.radius ?? data.officeRadius,
    };

    return {
      // Supports:
      // 1) officeLocation: { point: GeoPoint, radius }
      // 2) officeLocation: GeoPoint + top-level radius/officeRadius
      // 3) officeLocation: { latitude, longitude, radius }
      // 4) root-level latitude/longitude/radius
      officeLocation: normalizeOfficeLocation(
        data.officeLocation ?? data.location ?? mergedRootCandidate,
        data.radius ?? data.officeRadius
      ),
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.warn('Failed to load config/app from Firestore, using fallback office location.', error);
    return { officeLocation: OFFICE_LOCATION };
  }
};
