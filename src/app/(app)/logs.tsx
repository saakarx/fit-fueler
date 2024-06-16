import { ActivityIndicator } from 'react-native';

import { Box } from '@src/atoms';

const LogsScreen = () => {
  return (
    <Box bg='$background' flex={1}>
      <ActivityIndicator color='white' size='large' />
    </Box>
  );
};

export default LogsScreen;
