import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { OfficeLocation, readOfficeLocation, writeOfficeLocation } from './firebase';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const defaultOffice: OfficeLocation = {
  latitude: 0,
  longitude: 0,
  radius: 150,
};

const parseAdminEmails = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const OfficeForm = () => {
  const { user } = useUser();
  const [form, setForm] = useState<OfficeLocation>(defaultOffice);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('-');
  const adminEmails = useMemo(() => parseAdminEmails(import.meta.env.VITE_ADMIN_EMAILS), []);

  const signedInEmail = (user?.primaryEmailAddress?.emailAddress ?? '').toLowerCase();
  const isAllowed = adminEmails.length === 0 || adminEmails.includes(signedInEmail);

  const load = async () => {
    setLoadError(null);
    try {
      const config = await readOfficeLocation();
      if (config) setForm(config);
      setLastUpdatedAt(new Date().toLocaleString());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load config');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaveState('saving');
    setSaveMessage('');
    try {
      if (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude)) {
        throw new Error('Latitude and longitude must be valid numbers.');
      }
      if (form.radius <= 0) {
        throw new Error('Radius must be greater than 0.');
      }
      await writeOfficeLocation(form);
      setSaveState('saved');
      setSaveMessage('Office location updated successfully.');
      setLastUpdatedAt(new Date().toLocaleString());
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Unable to save config');
    }
  };

  if (!isAllowed) {
    return (
      <div className="card">
        <h2>Access denied</h2>
        <p className="muted">This account is not allowed to update office config.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Office Location Admin</h2>
      <p className="muted">Updates Firestore `config/app.officeLocation` used by the mobile app.</p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
            required
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
            required
          />
        </label>
        <label>
          Radius (meters)
          <input
            type="number"
            step="1"
            min="1"
            value={form.radius}
            onChange={(e) => setForm((prev) => ({ ...prev, radius: Number(e.target.value) }))}
            required
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="ghost" onClick={load}>
            Reload
          </button>
        </div>
      </form>
      <p className="meta">Last local refresh: {lastUpdatedAt}</p>
      {loadError ? <p className="error">{loadError}</p> : null}
      {saveMessage ? (
        <p className={saveState === 'error' ? 'error' : 'success'}>{saveMessage}</p>
      ) : null}
    </div>
  );
};

export default function App() {
  return (
    <div className="page">
      <header className="topbar">
        <h1>Attendance Admin</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <SignedOut>
        <div className="card">
          <h2>Sign in required</h2>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        <OfficeForm />
      </SignedIn>
    </div>
  );
}
