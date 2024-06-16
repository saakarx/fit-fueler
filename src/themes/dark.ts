import { createTheme } from '@shopify/restyle';

import Light, { Theme } from './light';

const theme = createTheme<Theme>({
  ...Light,
  colors: {
    ...Light.colors,

    $background: '#212529',
    $foreground: '#fbf7fa',
    $bottomBarBg: Light.colors.black700,

    activeBottomBarItemBg: Light.colors.white,
  },
  statusBar: {
    barStyle: 'light-content',
  },
});

export default theme;
