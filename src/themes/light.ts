import { createTheme } from '@shopify/restyle';
import { StatusBarStyle } from 'react-native';

const p = {
  white300: '#F8F9FA',
  white500: '#E9ECEF',
  white700: '#DEE2E6',
  white900: '#CED4DA',

  black300: '#6C757D',
  black500: '#495057',
  black700: '#343A40',
  black900: '#212529',

  pink: '#FEEAFA',
  purple: '#BDB2FF',
  lightGreen: '#BEE3DB',
  red: '#DA4167',
  yellow: '#FDFFB6',
  lightBlue: '#9BF6FF',
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
    pink: p.pink,
    purple: p.purple,
    white: p.white300,
    lightGreen: p.lightGreen,
    yellow: p.yellow,
    lightBlue: p.lightBlue,

    activeBottomBarLink: '#9BF6FF',
    activeBottomBarItemBg: p.white700,
    inactiveBottomBarLink: p.white300,

    black300: p.black300,
    black500: p.black500,
    black700: p.black700,
    black900: p.black900,

    $foreground: '#121212',
    $background: '#fbf7fa',
    $bottomBarBg: p.white700,

    $fieldInputPlaceholderTextColor: '#6C757D',
    $fieldInputBorderColor: '#454D54',

    danger: p.red,
  },
  spacing: {
    '0': 0,
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
  zIndices: {
    '-1000': -1000,
    '-100': -100,
    '-10': -10,
    '-1': -1,
    0: 0,
    1: 1,
    10: 10,
    100: 100,
    1000: 1000,
  },
});

export type Theme = typeof theme;
export default theme;
