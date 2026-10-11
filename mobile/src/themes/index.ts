import Light, { Theme } from './light';
import Dark from './dark';

export type ThemeNames = 'light' | 'dark';

export interface ThemeMeta {
  id: ThemeNames;
  title: string;
  theme: Theme;
}

export const themes: readonly ThemeMeta[] = [
  { id: 'light', title: 'Light', theme: Light },
  { id: 'dark', title: 'Dark', theme: Dark },
];

export type { Theme };
