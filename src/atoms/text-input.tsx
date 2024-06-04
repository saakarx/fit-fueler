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
  spacing,
  SpacingProps,
  spacingShorthand,
  SpacingShorthandProps,
  typography,
  TypographyProps,
  useRestyle,
  useTheme,
} from '@shopify/restyle';
import React, { forwardRef } from 'react';
import { TextInput as NativeTextInput } from 'react-native';

import { Theme } from '@src/themes';

type RestyleProps = SpacingProps<Theme> &
  SpacingShorthandProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  BackgroundColorShorthandProps<Theme> &
  ColorProps<Theme> &
  TypographyProps<Theme> &
  LayoutProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  color,
  spacing,
  spacingShorthand,
  border,
  backgroundColor,
  backgroundColorShorthand,
  typography,
  layout,
]);

type TextInputProps = React.ComponentPropsWithRef<typeof NativeTextInput> &
  RestyleProps & {
    placeholderColor?: keyof Theme['colors'];
  };

const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  ({ placeholderColor, ...rest }, ref) => {
    const props = useRestyle(restyleFunctions, rest);
    const theme = useTheme<Theme>();

    const placeholderTextColorValue =
      placeholderColor && theme.colors[placeholderColor];

    return (
      <NativeTextInput
        ref={ref}
        {...props}
        placeholderTextColor={placeholderTextColorValue}
      />
    );
  }
);

export default TextInput;
