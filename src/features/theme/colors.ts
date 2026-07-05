export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textDim: string;
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  gold: string;
}

export const darkColors: Omit<ThemeColors, 'accent' | 'onAccent'> = {
  bg: '#0C0D12',
  surface: '#171921',
  surfaceAlt: '#20232E',
  border: '#2A2E3A',
  text: '#F5F6F8',
  textDim: '#9AA0AC',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  gold: '#FFD60A',
};

export const lightColors: Omit<ThemeColors, 'accent' | 'onAccent'> = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEFF3',
  border: '#E3E5EA',
  text: '#16181D',
  textDim: '#6E7480',
  success: '#248A3D',
  warning: '#C93400',
  danger: '#D70015',
  gold: '#B8860B',
};

export interface AccentTheme {
  id: string;
  name: string;
  accent: string;
  onAccent: string;
  /** Coin price. 0 = free. */
  price: number;
}

export const accentThemes: AccentTheme[] = [
  { id: 'coral', name: 'Coral', accent: '#FF5470', onAccent: '#FFFFFF', price: 0 },
  { id: 'ocean', name: 'Ocean', accent: '#0A84FF', onAccent: '#FFFFFF', price: 300 },
  { id: 'grape', name: 'Grape', accent: '#BF5AF2', onAccent: '#FFFFFF', price: 300 },
  { id: 'mint', name: 'Mint', accent: '#34C79A', onAccent: '#04140E', price: 300 },
  { id: 'sunset', name: 'Sunset', accent: '#FF9F0A', onAccent: '#1A1000', price: 300 },
  { id: 'gold', name: 'Gold', accent: '#FFD60A', onAccent: '#1A1400', price: 600 },
];

export function getAccentTheme(id: string): AccentTheme {
  return accentThemes.find((t) => t.id === id) ?? accentThemes[0];
}
