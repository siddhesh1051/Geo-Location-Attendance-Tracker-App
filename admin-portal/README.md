# Attendance Admin Portal

Tiny authenticated web portal to update office geofence config for the mobile app.

## What it updates

Firestore document:

- `config/app`
  - `officeLocation.latitude`
  - `officeLocation.longitude`
  - `officeLocation.radius`
  - `updatedAt`

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill env values in `.env`:

- Clerk:
  - `VITE_CLERK_PUBLISHABLE_KEY`
  - `VITE_ADMIN_EMAILS` (comma-separated allowlist)
- Firebase:
  - `VITE_FIREBASE_*` values from your project

3. Install and run:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Auth behavior

- User must sign in with Clerk.
- If `VITE_ADMIN_EMAILS` is set, only those emails can edit.
- If `VITE_ADMIN_EMAILS` is empty, any signed-in Clerk user can edit.
