import {
  backgroundColor,
  BackgroundColorProps,
  backgroundColorShorthand,
  BackgroundColorShorthandProps,
  border,
  BorderProps,
  color,
  ColorProps,
  composeRestyleFunctions,
  layout,
  LayoutProps,
  opacity,
  OpacityProps,
  PositionProps,
  spacing,
  SpacingProps,
  spacingShorthand,
  SpacingShorthandProps,
  typography,
  TypographyProps,
  useRestyle,
} from '@shopify/restyle';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import React, { forwardRef } from 'react';

import { Theme } from '@src/themes';

type RestyleProps = SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme> &
  TypographyProps<Theme> &
  LayoutProps<Theme> &
  Omit<PositionProps<Theme>, 'start' | 'end'> &
  OpacityProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  color,
  spacing,
  spacingShorthand,
  border,
  backgroundColor,
  backgroundColorShorthand,
  typography,
  layout,
  opacity,
]);

export type LinearGradientProps = React.ComponentPropsWithRef<
  typeof RNLinearGradient
> &
  RestyleProps & {};

const LinearGradient = forwardRef<RNLinearGradient, LinearGradientProps>(
  ({ colors, start, end, ...rest }, ref) => {
    const props = useRestyle(restyleFunctions, rest);

    return (
      <RNLinearGradient
        colors={colors}
        start={start}
        end={end}
        ref={ref}
        {...props}
      />
    );
  }
);

export default LinearGradient;
