import { StyleSheet } from 'react-native-unistyles';

const lightTheme = {
  colors: {
    bg: '#F3F7F5',
    bgElevated: '#FFFFFF',
    bgMuted: '#E5EEEA',
    ink: '#1B2B26',
    inkSoft: '#4A5F57',
    inkFaint: '#7A8F86',
    primary: '#1F7A66',
    primaryPressed: '#176353',
    primarySoft: '#D8EDE6',
    accent: '#E8A54B',
    danger: '#C44B4B',
    dangerSoft: '#F8E4E4',
    success: '#2F8F5B',
    successSoft: '#D9F0E3',
    border: '#D3E0DA',
    overlay: 'rgba(27, 43, 38, 0.45)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 12,
    md: 18,
    lg: 28,
    full: 999,
  },
  typography: {
    brand: {
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: 36,
      lineHeight: 42,
    },
    title: {
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: 28,
      lineHeight: 34,
    },
    headline: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 22,
      lineHeight: 28,
    },
    body: {
      fontFamily: 'Nunito_500Medium',
      fontSize: 18,
      lineHeight: 26,
    },
    bodyBold: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 18,
      lineHeight: 26,
    },
    caption: {
      fontFamily: 'Nunito_500Medium',
      fontSize: 15,
      lineHeight: 20,
    },
    button: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 18,
      lineHeight: 22,
    },
  },
  gap: (v: number) => v * 8,
} as const;

const darkTheme = {
  ...lightTheme,
  colors: {
    bg: '#12201C',
    bgElevated: '#1B2E28',
    bgMuted: '#243832',
    ink: '#F2F7F4',
    inkSoft: '#B7C9C1',
    inkFaint: '#80968C',
    primary: '#3CB89A',
    primaryPressed: '#2F9A80',
    primarySoft: '#1E3F36',
    accent: '#E8A54B',
    danger: '#E07474',
    dangerSoft: '#3A2424',
    success: '#5BC48A',
    successSoft: '#1F3A2C',
    border: '#2F4640',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },
} as const;

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  settings: {
    adaptiveThemes: true,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
});

export type Theme = typeof lightTheme;
