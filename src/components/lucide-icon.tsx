import {
  SpacingProps,
  SpacingShorthandProps,
  BorderProps,
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  ColorProps,
  TypographyProps,
  LayoutProps,
  composeRestyleFunctions,
  color,
  spacing,
  spacingShorthand,
  border,
  backgroundColor,
  backgroundColorShorthand,
  typography,
  layout,
  useRestyle,
  useTheme,
} from '@shopify/restyle';
import {
  LucideIcon as LucideIconRN,
  LucideProps as LucidePropsRN,
} from 'lucide-react-native';
import React from 'react';

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

export type LucideIconProps = Omit<LucidePropsRN, 'stroke'> &
  RestyleProps & {
    Icon: LucideIconRN;
    stroke?: keyof Theme['colors'];
  };

const LucideIcon: React.FC<LucideIconProps> = ({
  Icon,
  stroke = '$foreground',
  ...rest
}) => {
  const props = useRestyle(restyleFunctions, rest);
  const theme = useTheme<Theme>();

  const strokeColorValue = theme.colors[stroke];

  return <Icon stroke={strokeColorValue} {...props} />;
};

export default LucideIcon;
