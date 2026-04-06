export type AttendanceStatus = 'present' | 'wfh' | 'leave' | 'unset';

export type AttendanceRecord = {
  status: AttendanceStatus;
  manual: boolean;
  updatedAt: string;
};

export type AttendanceMap = Record<string, AttendanceRecord>;

export type OfficeLocation = {
  latitude: number;
  longitude: number;
  radius: number;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type AppSettings = {
  officeLocation: OfficeLocation;
  themeMode: ThemeMode;
};
