import {
  backgroundColor,
  BackgroundColorProps,
  backgroundColorShorthand,
  BackgroundColorShorthandProps,
  border,
  BorderProps,
  composeRestyleFunctions,
  opacity,
  OpacityProps,
  ResponsiveValue,
  useResponsiveProp,
  useRestyle,
  useTheme,
} from '@shopify/restyle';
import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';

import { Theme } from '@src/themes';
import Pressable, { PressableProps } from './pressable';

type RestyleProps = BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  BorderProps<Theme> &
  OpacityProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  backgroundColorShorthand,
  backgroundColor,
  border,
  opacity,
]);

interface Props extends PressableProps {
  pressed?: RestyleProps;
  rippleColor?: keyof Theme['colors'];
  rippleBorderless?: boolean;
}

const Touchable = ({
  pressed,
  rippleColor,
  rippleBorderless,
  style,
  ...rest
}: Props) => {
  const { style: pressedStyle } = pressed
    ? useRestyle(restyleFunctions, pressed)
    : { style: undefined };
  const theme = useTheme<Theme>();
  const rippleColorValue = rippleColor && theme.colors[rippleColor];

  return (
    <Pressable
      {...rest}
      android_ripple={{
        color: rippleColorValue,
        borderless: rippleBorderless,
      }}
      style={({ pressed: isPressed }) =>
        (isPressed ? [style, pressedStyle] : style) as StyleProp<ViewStyle>
      }
    />
  );
};

export const TouchableOpacity: React.FC<Props> = props => (
  <Touchable
    rippleColor='$foreground'
    {...props}
    pressed={{ opacity: Platform.select({ ios: 0.6, android: 0.6 }) }}
  />
);

export default Touchable;
