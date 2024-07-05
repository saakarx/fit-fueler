import {
  BackgroundColorProps,
  LayoutProps,
  OpacityProps,
  PositionProps,
  SpacingProps,
  backgroundColor,
  composeRestyleFunctions,
  layout,
  opacity,
  position,
  spacing,
  useRestyle,
  useTheme,
} from '@shopify/restyle';
import React, { forwardRef } from 'react';
import {
  ActivityIndicator as RNActivityIndicator,
  ActivityIndicatorProps as RNActivityIndicatorProps,
} from 'react-native';

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
