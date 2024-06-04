import { createTheme } from '@shopify/restyle';
import { StatusBarStyle } from 'react-native';

const p = {
  white: 'white',
  black: '#121212',
};

const theme = createTheme({
  borderRadii: {
    0: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 40,
    full: 99999999,
  },
  colors: {
    $foreground: '#121212',
    $background: '#fbf7fa',
  },
  spacing: {
    0: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 40,
  },
  statusBar: {
    barStyle: 'dark-content' as StatusBarStyle,
  },
  textVariants: {
    defaults: {
      color: '$foreground',
      fontSize: 16,
      fontFamily: 'WorkSans_400Regular',
    },
  },
});

export type Theme = typeof theme;
export default theme;
