import React, { ComponentProps, FC, PropsWithChildren } from 'react';

import { Box, TextInput } from '@src/atoms';
import LucideIcon from './lucide-icon';
import { TextInputProps } from '@src/atoms/text-input';

type InputProps = PropsWithChildren & TextInputProps & {};

type InputComposition = {
  Icon: FC<ComponentProps<typeof LucideIcon>>;
  Field: FC<ComponentProps<typeof TextInput>>;
};

const Input: FC<InputProps> & InputComposition = ({
  children,
  flexDirection = 'row',
  alignItems = 'center',
  borderColor = '$fieldInputBorderColor',
  borderWidth = 1,
  borderRadius = 'md',
  ...props
}) => {
  return (
    <Box
      flexDirection={flexDirection}
      alignItems={alignItems}
      borderColor={borderColor}
      borderWidth={borderWidth}
      borderRadius={borderRadius}
      {...props}
    >
      {children}
    </Box>
  );
};

Input.Icon = ({
  strokeWidth = 1.5,
  stroke = '$foreground',
  absoluteStrokeWidth = true,
  size = 18,
  ...props
}) => (
  <LucideIcon
    strokeWidth={strokeWidth}
    stroke={stroke}
    absoluteStrokeWidth={absoluteStrokeWidth}
    size={size}
    {...props}
  />
);
Input.Field = React.forwardRef(
  (
    {
      placeholderColor = '$fieldInputPlaceholderTextColor',
      fontFamily = 'WorkSans_400Regular',
      color = '$foreground',
      flex = 1,
      fontSize = 16,
      height = 45,
      ...props
    },
    ref
  ) => (
    <TextInput
      placeholderColor={placeholderColor}
      fontFamily={fontFamily}
      fontSize={fontSize}
      flex={flex}
      color={color}
      height={height}
      ref={ref}
      {...props}
    />
  )
);

export default Input;
