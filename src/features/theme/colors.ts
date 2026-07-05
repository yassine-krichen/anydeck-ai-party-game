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

/**
 * Ink-and-amber system. Neutrals are slightly warm so surfaces read as
 * material, not dead gray; every deck hue is drawn from one consistent
 * saturation family so the catalog looks curated rather than generated.
 */
export const darkColors: Omit<ThemeColors, 'accent' | 'onAccent'> = {
  bg: '#101014',
  surface: '#1A1A20',
  surfaceAlt: '#24242C',
  border: '#2E2E38',
  text: '#F4F2EE',
  textDim: '#8F8F9B',
  success: '#4CAF6D',
  warning: '#E8912D',
  danger: '#E5484D',
  gold: '#E2B93B',
};

export const lightColors: Omit<ThemeColors, 'accent' | 'onAccent'> = {
  bg: '#F4F3F0',
  surface: '#FFFFFF',
  surfaceAlt: '#EAE8E3',
  border: '#DDDBD4',
  text: '#1B1B20',
  textDim: '#6E6E78',
  success: '#2F7C4C',
  warning: '#A85F00',
  danger: '#C62A2F',
  gold: '#8F7514',
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
  { id: 'torch', name: 'Torch', accent: '#E8912D', onAccent: '#1A1206', price: 0 },
  { id: 'cobalt', name: 'Cobalt', accent: '#3E63DD', onAccent: '#FFFFFF', price: 300 },
  { id: 'fern', name: 'Fern', accent: '#3D9A50', onAccent: '#0A1A0E', price: 300 },
  { id: 'rosewood', name: 'Rosewood', accent: '#CE4257', onAccent: '#FFFFFF', price: 300 },
  { id: 'lagoon', name: 'Lagoon', accent: '#0E9888', onAccent: '#06201C', price: 300 },
  { id: 'bone', name: 'Bone', accent: '#E8E4DA', onAccent: '#1B1B20', price: 600 },
];

export function getAccentTheme(id: string): AccentTheme {
  return accentThemes.find((t) => t.id === id) ?? accentThemes[0];
}

/** Rank colors for standings (gold / silver / bronze). */
export const rankColors = ['#E2B93B', '#A8ADB8', '#B0713F'];
