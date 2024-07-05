import React from 'react';

import { Text } from '@src/atoms';
import { TextProps } from '@src/atoms/text';

const FieldError = ({
  touched,
  error,
  mt = 'xs',
  mb = 'sm',
  fontFamily = 'WorkSans_700Bold_Italic',
  fontWeight = '700',
  fontStyle = 'italic',
  fontSize = 14,
  color = 'danger',
  ...props
}: {
  touched: boolean | undefined;
  error: string | undefined;
} & TextProps) => {
  if (touched && error)
    return (
      <Text
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        fontFamily={fontFamily}
        mt={mt}
        mb={mb}
        color={color}
        {...props}
      >
        * {error}
      </Text>
    );
  else return null;
};

export default FieldError;
