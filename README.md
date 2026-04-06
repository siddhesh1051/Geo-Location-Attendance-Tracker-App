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

## Notes

- Background location reliability depends on OS battery/background policies.
- Manual overrides always take priority over auto-detection for that day.
# Geo-Location-Attendance-Tracker-App
