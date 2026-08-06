/** Warm high-contrast palette for home-screen widgets (matches app day theme). */
export const widgetDay = {
  bg: '#FFF9F2',
  bgMuted: '#F3E6D8',
  ink: '#141210',
  inkSoft: '#3A342E',
  primary: '#C2410C',
  primarySoft: '#FFEDD5',
  accentInk: '#9A3412',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  success: '#B45309',
  successSoft: '#FEF3C7',
  border: '#E0CDB8',
  onPrimary: '#FFFFFF',
} as const;

export const widgetNight = {
  bg: '#1A1614',
  bgMuted: '#2A2420',
  ink: '#FFF9F2',
  inkSoft: '#E8D9C8',
  primary: '#FB923C',
  primarySoft: '#3D2A1A',
  accentInk: '#FED7AA',
  danger: '#FCA5A5',
  dangerSoft: '#3F1A1A',
  success: '#FCD34D',
  successSoft: '#3D2E10',
  border: '#3D342C',
  onPrimary: '#1A1614',
} as const;

/** High contrast — light, like the app: white / black, strong red actions */
export const widgetHighContrast = {
  bg: '#FFFFFF',
  bgMuted: '#F5F5F5',
  ink: '#000000',
  inkSoft: '#000000',
  primary: '#B91C1C',
  primarySoft: '#FEE2E2',
  accentInk: '#000000',
  danger: '#7F1D1D',
  dangerSoft: '#FEE2E2',
  success: '#92400E',
  successSoft: '#FEF3C7',
  border: '#000000',
  onPrimary: '#FFFFFF',
} as const;

export type WidgetPalette =
  | typeof widgetDay
  | typeof widgetNight
  | typeof widgetHighContrast;

export function paletteForAppearance(
  appearance: 'day' | 'night' | 'highContrast' | 'system',
  mode: 'light' | 'dark',
): WidgetPalette {
  if (appearance === 'highContrast') return widgetHighContrast;
  if (appearance === 'night') return widgetNight;
  if (appearance === 'day') return widgetDay;
  return mode === 'dark' ? widgetNight : widgetDay;
}
