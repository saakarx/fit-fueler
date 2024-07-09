import { createTheme } from '@shopify/restyle';

import Light, { Theme } from './light';

const theme = createTheme<Theme>({
  ...Light,
  colors: {
    ...Light.colors,

    pink: '#FEEAFA',
    lightGreen: '#BEE3DB',

    $foreground: '#F8F9FA',
    $background: Light.colors.black900,
    $backgroundRippleColor: Light.colors.black700,

    $bottomBarBg: Light.colors.black700,
    $bottomBarInactiveItemBg: Light.colors.black700,
    $bottomBarActiveItemBg: Light.colors.black500,
    $bottomBarActiveItem: Light.colors.lightBlue,
    $bottomBarItemBorder: Light.colors.black300,

    $logItemBg: Light.colors.black700,
    $logItemRippleColor: Light.colors.black500,
    $logItemButtonBg: Light.colors.black500,
    $logItemButtonRippleColor: Light.colors.black700,

    $addButtonBg: Light.colors.black700,
    $addButtonRippleColor: Light.colors.black500,
    $addButtonBorder: Light.colors.black300,

    $addWorkoutButtonTextColor: Light.colors.lightBlue,
    $addMealButtonTextColor: Light.colors.yellow,
    $addWaterButtonTextColor: '#BEE3DB',
  },
  statusBar: {
    barStyle: 'light-content',
  },
});

export default theme;
