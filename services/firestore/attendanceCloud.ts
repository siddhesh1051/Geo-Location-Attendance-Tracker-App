import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { defaultSettings } from '../../storage/attendanceStorage';
import { AppSettings, AttendanceMap } from '../../utils/types';
import { firestore } from '../firebase/firebase';

type CloudAttendanceState = {
  records: AttendanceMap;
  settings: AppSettings;
  updatedAt?: unknown;
};

const getUserDocRef = (userId: string) => doc(firestore, 'users', userId, 'attendance', 'state');

export const loadCloudAttendance = async (
  userId: string
): Promise<{ records: AttendanceMap; settings: AppSettings } | null> => {
  const snapshot = await getDoc(getUserDocRef(userId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as CloudAttendanceState;
  return {
    records: data.records ?? {},
    settings: { ...defaultSettings, ...(data.settings ?? {}) },
  };
};

export const saveCloudAttendance = async (
  userId: string,
  records: AttendanceMap,
  settings: AppSettings
): Promise<void> => {
  // Office location is universal (admin-managed in config/app). Never store it per-user.
  const { officeLocation: _omitOffice, ...settingsWithoutOffice } = settings as AppSettings & {
    officeLocation?: AppSettings['officeLocation'];
  };

  await setDoc(
    getUserDocRef(userId),
    {
      records,
      settings: settingsWithoutOffice,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const subscribeCloudAttendance = (
  userId: string,
  onChange: (payload: { records: AttendanceMap; settings: AppSettings } | null) => void
): (() => void) =>
  onSnapshot(getUserDocRef(userId), (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }
    const data = snapshot.data() as CloudAttendanceState;
    onChange({
      records: data.records ?? {},
      settings: { ...defaultSettings, ...(data.settings ?? {}) },
    });
  });
