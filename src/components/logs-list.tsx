import React, { PropsWithChildren } from 'react';

import { ActivityIndicator, Box, Text } from '@src/atoms';

type Props = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText?: string;
  error: any;
};

const LogsList: React.FC<PropsWithChildren<Props>> = ({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  error,
  children,
}) => {
  if (isLoading)
    return (
      <Box height={100} alignItems='center' justifyContent='center' gap='sm'>
        <ActivityIndicator size='large' color='pink' />
        <Text fontSize={14} color='pink'>
          Loading...
        </Text>
      </Box>
    );

  if (isError) {
    console.error(error);

    return (
      <Box py='md' px='sm'>
        <Text>Error getting logs</Text>
      </Box>
    );
  }

  if (isEmpty)
    return (
      <Box py='md' px='sm'>
        <Text>{emptyText ?? 'No logs'}</Text>
      </Box>
    );

  return (
    <Box gap='xs' my='sm'>
      {children}
    </Box>
  );
};

export default LogsList;
