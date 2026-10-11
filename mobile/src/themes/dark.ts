import { createTheme } from '@shopify/restyle';

import Light, { Theme } from './light';

const theme = createTheme<Theme>({
  ...Light,
  colors: {
    ...Light.colors,

    pink: '#F48FB1',
    purple: '#7E57C2',
    white: '#E0E0E0',
    lightGreen: '#80CBC4',
    yellow: '#FFD54F',
    lightBlue: '#4FC3F7',

    black300: '#424242',
    black500: '#303030',
    black700: '#212121',
    black900: '#121212',

    $foreground: '#E0E0E0',
    $background: '#121212',
    $backgroundRippleColor: '#303030',

    $bottomBarBg: '#212121',
    $bottomBarItemBorder: '#424242',
    $bottomBarActiveItem: '#4FC3F7',
    $bottomBarActiveItemBg: '#303030',
    $bottomBarInactiveItem: '#757575',
    $bottomBarInactiveItemBg: '#212121',

    $fieldInputPlaceholderTextColor: '#757575',
    $fieldInputBorderColor: '#424242',

    $logItemBg: '#212121',
    $logItemRippleColor: '#303030',
    $logItemButtonBg: '#303030',
    $logItemButtonRippleColor: '#424242',

    $addButtonBg: '#303030',
    $addButtonRippleColor: '#424242',
    $addButtonBorder: '#616161',

    $addWorkoutButtonTextColor: '#4FC3F7',
    $addMealButtonTextColor: '#FFD54F',
    $addWaterButtonTextColor: '#80CBC4',

    danger: '#EF5350',
  },
  statusBar: {
    barStyle: 'light-content',
  },
});

export default theme;
