import { ColorSchemeName } from 'react-native';

import { ThemeMode } from './types';

export const lightPalette = {
  background: '#F6F6F6',
  card: '#FFFFFF',
  text: '#0F0F0F',
  mutedText: '#7D7D7D',
  border: '#E6E6E6',
  overlay: 'rgba(0,0,0,0.25)',
  cardShadow: '#000000',
  tabBarBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
  buttonPrimaryBackground: '#111111',
  buttonPrimaryText: '#FFFFFF',
  buttonGhostBackground: '#FFFFFF',
};

export const darkPalette = {
  background: '#0E0E0E',
  card: '#161616',
  text: '#F3F3F3',
  mutedText: '#A6A6A6',
  border: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: '#000000',
  tabBarBackground: '#121212',
  inputBackground: '#1B1B1B',
  buttonPrimaryBackground: '#F2F2F2',
  buttonPrimaryText: '#121212',
  buttonGhostBackground: '#1B1B1B',
};

export const palette = {
  ...lightPalette,
  present: '#1FA15F',
  wfh: '#E9B949',
  leave: '#E24949',
  unset: '#5B7CFA',
  weekend: '#D8D8D8',
};

export type ThemePalette = typeof palette;

export const getTheme = (darkMode: boolean): ThemePalette => ({
  ...(darkMode ? darkPalette : lightPalette),
  present: palette.present,
  wfh: palette.wfh,
  leave: palette.leave,
  unset: palette.unset,
  weekend: palette.weekend,
});

export const isDarkResolved = (themeMode: ThemeMode, systemScheme: ColorSchemeName): boolean => {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return systemScheme !== 'light';
};

export const getStatusColor = (
  status?: 'present' | 'wfh' | 'leave' | 'unset' | 'weekend',
  theme: ThemePalette = palette
): string => {
  if (status === 'present') return theme.present;
  if (status === 'wfh') return theme.wfh;
  if (status === 'leave') return theme.leave;
  if (status === 'unset') return theme.unset;
  if (status === 'weekend') return theme.weekend;
  return theme.card;
};
