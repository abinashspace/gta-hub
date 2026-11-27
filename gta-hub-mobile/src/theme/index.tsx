import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

/**
 * One accent (GTA yellow), one warm grey family, one radius scale.
 * Light is warm paper, dark is near-black ink — no purple, no glass cards.
 */
const DARK = {
  mode: 'dark' as const,
  bg: '#0B0B0C',
  bgSunken: '#070708',
  surface: '#141416',
  surfaceRaised: '#1C1C1F',
  surfacePressed: '#232327',
  line: '#2A2A2E',
  lineSoft: '#1D1D20',
  text: '#F6F4EF',
  textSecondary: '#A9A59C',
  textTertiary: '#6E6B65',
  accent: '#FFD23F',
  accentInk: '#0B0B0C',
  accentSoft: 'rgba(255, 210, 63, 0.14)',
  success: '#8BD450',
  danger: '#FF6363',
  overlay: 'rgba(5, 5, 6, 0.72)',
  sheet: '#121214',
};

const LIGHT = {
  mode: 'light' as const,
  bg: '#F4F1EA',
  bgSunken: '#EBE7DD',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfacePressed: '#F0ECE2',
  line: '#D9D3C5',
  lineSoft: '#E7E2D6',
  text: '#121211',
  textSecondary: '#5E5A51',
  textTertiary: '#8E897E',
  accent: '#F2B600',
  accentInk: '#121211',
  accentSoft: 'rgba(242, 182, 0, 0.16)',
  success: '#3F8F2A',
  danger: '#C93737',
  overlay: 'rgba(18, 18, 17, 0.55)',
  sheet: '#FFFFFF',
};

export type Theme = typeof DARK | typeof LIGHT;
export type ThemeMode = 'light' | 'dark' | 'system';

export const Radii = { small: 8, card: 16, sheet: 24, pill: 999 } as const;
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 } as const;

export const Fonts = {
  display: 'RussoOne',
  body: 'ChakraPetch',
  medium: 'ChakraPetchMedium',
  semibold: 'ChakraPetchSemiBold',
  bold: 'ChakraPetchBold',
} as const;

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  colors: Theme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'gta-hub:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === 'light' ? 'light' : 'dark';
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') setModeState(stored);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const resolved = mode === 'system' ? system : mode;
  const theme = resolved === 'light' ? LIGHT : DARK;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme,
      mode,
      setMode,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [theme, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
