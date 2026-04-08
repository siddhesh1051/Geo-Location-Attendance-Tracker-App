import { getApp, getApps, initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

export type OfficeLocation = {
  latitude: number;
  longitude: number;
  radius: number;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const configRef = doc(firestore, 'config', 'app');

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

export const readOfficeLocation = async (): Promise<OfficeLocation | null> => {
  const snap = await getDoc(configRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const raw = (data.officeLocation ?? data.location ?? data) as Record<string, unknown>;
  const latitude =
    toNumber(raw.latitude) ?? toNumber(raw.lat) ?? toNumber((raw.point as Record<string, unknown>)?.latitude);
  const longitude =
    toNumber(raw.longitude) ??
    toNumber(raw.lng) ??
    toNumber(raw.long) ??
    toNumber((raw.point as Record<string, unknown>)?.longitude);
  const radius = toNumber(raw.radius) ?? toNumber(raw.officeRadius) ?? toNumber(data.radius) ?? 150;

  if (latitude === undefined || longitude === undefined) return null;
  return { latitude, longitude, radius };
};

export const writeOfficeLocation = async (officeLocation: OfficeLocation): Promise<void> => {
  await setDoc(
    configRef,
    {
      officeLocation,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
