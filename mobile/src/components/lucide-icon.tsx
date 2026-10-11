import {
  BackgroundColorProps,
  BackgroundColorShorthandProps,
  BorderProps,
  LayoutProps,
  SpacingProps,
  SpacingShorthandProps,
  TypographyProps,
  backgroundColor,
  backgroundColorShorthand,
  border,
  composeRestyleFunctions,
  layout,
  spacing,
  spacingShorthand,
  typography,
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
  TypographyProps<Theme> &
  LayoutProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
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
  color,
  ...rest
}) => {
  const props = useRestyle(restyleFunctions, rest);
  const theme = useTheme<Theme>();

  const strokeColorValue = theme.colors[stroke];

  return <Icon stroke={strokeColorValue} color={color} {...props} />;
};

export default LucideIcon;
