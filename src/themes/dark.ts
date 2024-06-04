import { createTheme } from '@shopify/restyle';

import Light, { Theme } from './light';

const theme = createTheme<Theme>({
  ...Light,
  colors: {
    $background: '#212529',
    $foreground: '#fbf7fa',
  },
  statusBar: {
    barStyle: 'light-content',
  },
});

export default theme;
