import { useTheme } from '@shopify/restyle';
import React from 'react';
import { StatusBar as NativeStatusBar } from 'react-native';

import { Theme } from '../themes';

const StatusBar = () => {
  const theme = useTheme<Theme>();

  return (
    <NativeStatusBar
      backgroundColor={theme.colors.$background || 'red'}
      animated={true}
      barStyle={theme.statusBar.barStyle}
    />
  );
};

export default StatusBar;
