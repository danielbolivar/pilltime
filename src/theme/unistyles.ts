import { Appearance, StatusBar } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';

const sharedSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const sharedRadii = {
  sm: 12,
  md: 18,
  lg: 28,
  full: 999,
} as const;

const sharedTypography = {
  brand: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    lineHeight: 42,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 30,
    lineHeight: 36,
  },
  headline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    lineHeight: 30,
  },
  body: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 20,
    lineHeight: 28,
  },
  bodyBold: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    lineHeight: 28,
  },
  caption: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    lineHeight: 24,
  },
} as const;

/** Day — warm luminous light, high contrast */
const lightTheme = {
  colors: {
    bg: '#FFF9F2',
    bgElevated: '#FFFFFF',
    bgMuted: '#F3E6D8',
    ink: '#141210',
    inkSoft: '#3A342E',
    inkFaint: '#5C534C',
    primary: '#C2410C',
    primaryPressed: '#9A3412',
    primarySoft: '#FFEDD5',
    accent: '#EA580C',
    accentSoft: '#FFEDD5',
    accentInk: '#9A3412',
    danger: '#B91C1C',
    dangerSoft: '#FEE2E2',
    success: '#B45309',
    successSoft: '#FEF3C7',
    border: '#E0CDB8',
    overlay: 'rgba(20, 18, 16, 0.45)',
    onPrimary: '#FFFFFF',
  },
  spacing: sharedSpacing,
  radii: sharedRadii,
  typography: sharedTypography,
  gap: (v: number) => v * 8,
} as const;

/** Night — warm dark, bright text and orange accents */
const darkTheme = {
  colors: {
    bg: '#1A1510',
    bgElevated: '#2A221A',
    bgMuted: '#3A3026',
    ink: '#FFF9F2',
    inkSoft: '#F0E2D3',
    inkFaint: '#D4C4B3',
    primary: '#FB923C',
    primaryPressed: '#F97316',
    primarySoft: '#3F2A18',
    accent: '#FDBA74',
    accentSoft: '#3F2A18',
    accentInk: '#FED7AA',
    danger: '#F87171',
    dangerSoft: '#4C1D1D',
    success: '#FBBF24',
    successSoft: '#3F2E10',
    border: '#5C4A3A',
    overlay: 'rgba(0, 0, 0, 0.55)',
    onPrimary: '#141210',
  },
  spacing: sharedSpacing,
  radii: sharedRadii,
  typography: sharedTypography,
  gap: (v: number) => v * 8,
} as const;

/** High contrast — pure white / black, strong red-orange actions */
const highContrastTheme = {
  colors: {
    bg: '#FFFFFF',
    bgElevated: '#FFFFFF',
    bgMuted: '#F5F5F5',
    ink: '#000000',
    inkSoft: '#000000',
    inkFaint: '#1A1A1A',
    primary: '#B91C1C',
    primaryPressed: '#7F1D1D',
    primarySoft: '#FEE2E2',
    accent: '#C2410C',
    accentSoft: '#FFEDD5',
    accentInk: '#000000',
    danger: '#7F1D1D',
    dangerSoft: '#FEE2E2',
    success: '#92400E',
    successSoft: '#FEF3C7',
    border: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
    onPrimary: '#FFFFFF',
  },
  spacing: sharedSpacing,
  radii: sharedRadii,
  typography: {
    ...sharedTypography,
    body: { ...sharedTypography.body, fontSize: 22, lineHeight: 30 },
    bodyBold: { ...sharedTypography.bodyBold, fontSize: 22, lineHeight: 30 },
    button: { ...sharedTypography.button, fontSize: 22, lineHeight: 26 },
    caption: { ...sharedTypography.caption, fontSize: 18, lineHeight: 24 },
  },
  gap: (v: number) => v * 8,
} as const;

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
  highContrast: typeof highContrastTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  settings: {
    adaptiveThemes: false,
    initialTheme: 'light',
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
    highContrast: highContrastTheme,
  },
});

export type AppearanceMode = 'day' | 'night' | 'highContrast' | 'system';
export type UnistylesThemeName = keyof AppThemes;

export function resolveThemeName(mode: AppearanceMode): UnistylesThemeName {
  if (mode === 'day') return 'light';
  if (mode === 'night') return 'dark';
  if (mode === 'highContrast') return 'highContrast';
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function applyAppearance(mode: AppearanceMode): void {
  try {
    const themeName = resolveThemeName(mode);
    if (UnistylesRuntime.themeName !== themeName) {
      UnistylesRuntime.setTheme(themeName);
    }
    const colors = UnistylesRuntime.getTheme(themeName).colors;
    UnistylesRuntime.setRootViewBackgroundColor(colors.bg);
    StatusBar.setBarStyle(themeName === 'dark' ? 'light-content' : 'dark-content');
  } catch {
    // runtime may not be ready yet
  }
}

export type Theme = typeof lightTheme;
