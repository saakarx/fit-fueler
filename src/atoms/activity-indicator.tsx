import {
  ActivityIndicator as RNActivityIndicator,
  ActivityIndicatorProps as RNActivityIndicatorProps,
} from 'react-native';
import {
  BackgroundColorProps,
  OpacityProps,
  PositionProps,
  SpacingProps,
  LayoutProps,
  backgroundColor,
  opacity,
  position,
  spacing,
  layout,
  useRestyle,
  useTheme,
  composeRestyleFunctions,
} from '@shopify/restyle';
import { forwardRef } from 'react';

import { Theme } from '@src/themes';

type RestyleProps = BackgroundColorProps<Theme> &
  OpacityProps<Theme> &
  SpacingProps<Theme> &
  PositionProps<Theme> &
  LayoutProps<Theme>;

type ActivityIndicatorProps = RNActivityIndicatorProps &
  RestyleProps & {
    color?: keyof Theme['colors'];
  };

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  backgroundColor,
  opacity,
  spacing,
  position,
  layout,
]);

const ActivityIndicator = forwardRef<
  RNActivityIndicator,
  ActivityIndicatorProps
>(({ color = 'white', ...rest }, ref) => {
  const props = useRestyle(restyleFunctions, rest);
  const theme = useTheme<Theme>();
  const colorValue = theme.colors[color];

  return <RNActivityIndicator {...props} ref={ref} color={colorValue} />;
});

export type { ActivityIndicatorProps };
export default ActivityIndicator;
