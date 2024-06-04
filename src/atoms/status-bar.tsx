import { useTheme } from '@shopify/restyle';
import { StatusBar as NativeStatusBar } from 'react-native';
import { Theme } from '../themes';

const StatusBar = () => {
  const theme = useTheme<Theme>();

  return (
    <NativeStatusBar
      backgroundColor={theme.colors.$background || 'white'}
      animated={true}
      barStyle={theme.statusBar.barStyle}
    />
  );
};

export default StatusBar;
