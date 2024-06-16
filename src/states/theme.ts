import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { Theme, ThemeNames, themes } from '@src/themes';
import { storage } from '.';

export const THEME_KEY = '@theme';

export const activeThemeId = atomWithStorage<ThemeNames>(
  THEME_KEY,
  'light',
  storage<ThemeNames>()
);

export const activeThemeAtom = atom<Promise<Theme>>(async get => {
  const themeId = await get(activeThemeId);

  const themeIdx = themes.findIndex(theme => theme.id === themeId);

  if (themeIdx !== -1) return themes[themeIdx].theme;
  else return themes[0].theme;
});
