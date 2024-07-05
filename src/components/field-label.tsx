import React from 'react';

import { Text } from '@src/atoms';

const FieldLabel = ({ label }: { label: string }) => {
  return (
    <Text
      color='$fieldInputPlaceholderTextColor'
      fontSize={15}
      fontWeight='500'
      fontFamily='WorkSans_500Medium'
      mt='sm'
      mb='xs'
    >
      {label}
    </Text>
  );
};

export default FieldLabel;
