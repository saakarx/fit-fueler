import React from 'react';

import { Box, ScrollView, Text } from '@src/atoms';
import Charts from '@src/components/charts';

const AnalyticsScreen = () => {
  return (
    <ScrollView flex={1} backgroundColor='$background'>
      <Box flex={1} bg='$background' py='xl' px='md'>
        <Text
          fontSize={66}
          fontFamily='BricolageGrotesque_400Regular'
          lineHeight={66}
          color='black500'
          my='md'
        >
          Analytics
        </Text>
      </Box>

      <Charts />
    </ScrollView>
  );
};

export default AnalyticsScreen;
