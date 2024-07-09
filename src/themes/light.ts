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
  lightGreen: '#67E4C9',
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
    pink: '#FA9EE8',
    purple: p.purple,
    white: p.white300,
    lightGreen: p.lightGreen,
    yellow: p.yellow,
    lightBlue: p.lightBlue,

    black300: p.black300,
    black500: p.black500,
    black700: p.black700,
    black900: p.black900,

    $foreground: p.black900,
    $background: p.white300,
    $backgroundRippleColor: p.white500,

    $bottomBarBg: '#F8F9FA',
    $bottomBarItemBorder: '#CED4DA',
    $bottomBarActiveItem: '#00A7E1',
    $bottomBarActiveItemBg: '#DEE2E6',
    $bottomBarInactiveItem: '#CED4DA',
    $bottomBarInactiveItemBg: '#F8F9FA',

    $fieldInputPlaceholderTextColor: '#6C757D',
    $fieldInputBorderColor: '#454D54',

    $logItemBg: p.white500,
    $logItemRippleColor: p.white300,
    $logItemButtonBg: p.white700,
    $logItemButtonRippleColor: p.white900,

    $addButtonBg: p.white500,
    $addButtonRippleColor: p.white500,
    $addButtonBorder: '#ddd',

    $addWorkoutButtonTextColor: '#0ABBCD',
    $addMealButtonTextColor: '#C8CD0A',
    $addWaterButtonTextColor: '#0ACD93',

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
