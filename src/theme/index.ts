export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  chartGrid: string;
};

export const palettes: Record<ColorScheme, ThemeColors> = {
  dark: {
    background: '#0B0F14',
    backgroundAlt: '#0F151C',
    surface: '#141C25',
    surfaceElevated: '#1B2530',
    border: '#253242',
    borderStrong: '#334155',
    text: '#F4F7FA',
    textSecondary: '#A3B0BF',
    textMuted: '#6B7A8C',
    primary: '#C8F542',
    primaryPressed: '#B4E036',
    primarySoft: '#1E2A12',
    onPrimary: '#0B0F14',
    success: '#4ADE80',
    successSoft: '#12281B',
    warning: '#FBBF24',
    warningSoft: '#2B2410',
    danger: '#F87171',
    dangerSoft: '#2C1517',
    info: '#60A5FA',
    infoSoft: '#122235',
    overlay: 'rgba(0, 0, 0, 0.62)',
    chartGrid: '#26313D',
  },
  light: {
    background: '#F6F7F3',
    backgroundAlt: '#EEF1E8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#DDE3D5',
    borderStrong: '#C5CEC0',
    text: '#121710',
    textSecondary: '#5C665A',
    textMuted: '#8A9488',
    primary: '#6E9900',
    primaryPressed: '#5D8200',
    primarySoft: '#EAF4D0',
    onPrimary: '#FFFFFF',
    success: '#15803D',
    successSoft: '#DCFCE7',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    info: '#2563EB',
    infoSoft: '#DBEAFE',
    overlay: 'rgba(18, 23, 16, 0.45)',
    chartGrid: '#D8DFD0',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  metric: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  timer: { fontSize: 76, lineHeight: 84, fontWeight: '800' as const },
} as const;

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
};
