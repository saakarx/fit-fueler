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
  buttonVariants: {
    defaults: {},
    primary: {},
    secondary: {},
  },
  buttonSize: {
    defaults: {},
    sm: {},
  },
  colors: {
    pink: '#E91E63',
    purple: '#5E60CE',
    white: '#FFFFFF',
    lightGreen: '#4CAF50',
    yellow: '#D97706',
    lightBlue: '#03A9F4',

    black300: '#9E9E9E',
    black500: '#616161',
    black700: '#424242',
    black900: '#212121',

    $foreground: '#212121',
    $background: '#FAFAFA',
    $backgroundRippleColor: '#E0E0E0',

    $bottomBarBg: '#FFFFFF',
    $bottomBarItemBorder: '#E0E0E0',
    $bottomBarActiveItem: '#1976D2',
    $bottomBarActiveItemBg: '#E3F2FD',
    $bottomBarInactiveItem: '#BDBDBD',
    $bottomBarInactiveItemBg: '#FFFFFF',

    $fieldInputPlaceholderTextColor: '#757575',
    $fieldInputBorderColor: '#B0BEC5',

    $logItemBg: '#FFFFFF',
    $logItemRippleColor: '#EEEEEE',
    $logItemButtonBg: '#F5F5F5',
    $logItemButtonRippleColor: '#E0E0E0',

    $addButtonBg: '#F5F5F5',
    $addButtonRippleColor: '#E0E0E0',
    $addButtonBorder: '#CCCCCC',

    $addWorkoutButtonTextColor: '#0288D1',
    $addMealButtonTextColor: '#FBC02D',
    $addWaterButtonTextColor: '#009688',

    danger: '#D32F2F',
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
      fontFamily: 'InterRegular',
    },
    display_2xl: {
      fontSize: 72,
      lineHeight: 90,
      letterSpacing: -0.02 * 16,
    },
    display_xl: {
      fontSize: 60,
      lineHeight: 72,
      letterSpacing: -0.02 * 16,
    },
    display_lg: {
      fontSize: 48,
      lineHeight: 60,
      letterSpacing: -0.02 * 16,
    },
    display_md: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.02 * 16,
    },
    display_sm: {
      fontSize: 30,
      lineHeight: 38,
      letterSpacing: -0.02 * 16,
    },
    display_xs: {
      fontSize: 24,
      lineHeight: 32,
    },
    xl: {
      fontSize: 20,
      lineHeight: 30,
    },
    lg: {
      fontSize: 18,
      lineHeight: 28,
    },
    md: {
      fontSize: 16,
      lineHeight: 24,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
    },
    xs: {
      fontSize: 12,
      lineHeight: 18,
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
