# Attendance Tracker (Expo)

Personal mobile app to auto-track office attendance using background location.

## Features

- Auto mark `Present` when entering office radius (geofence + background location updates)
- Auto default missing past working days to `WFH`
- Manual override (`Present`, `WFH`, `Leave`) per day
- Monthly attendance percentage with color thresholds
- Minimal black/white UI with status colors
- Bottom tab navigation (`Home`, `Calendar`, `Settings`)
- AsyncStorage persistence

## Configure Office Location

Edit `services/location/constants.ts`:

```ts
export const OFFICE_LOCATION = {
  latitude: 0,
  longitude: 0,
  radius: 150,
};
```

## Run

```bash
npm install
npm run start
```

Then open in Expo Go or emulator.

## EAS Preview Builds

Before building, make sure EAS is configured and env vars are available for cloud builds:

```bash
eas login
eas whoami
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "<value>" --scope project
eas env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "<value>" --scope project
```

Build commands:

```bash
npm run build:preview:android
npm run build:preview:ios
npm run build:preview:ios:simulator
```

- `build:preview:ios`: iOS internal distribution build for physical devices.
- `build:preview:ios:simulator`: iOS simulator build (`.app`) for local simulator testing.
- For physical iOS preview install, Apple Developer credentials + registered test devices are required.

## Notes

- Background location reliability depends on OS battery/background policies.
- Manual overrides always take priority over auto-detection for that day.
# Geo-Location-Attendance-Tracker-App
