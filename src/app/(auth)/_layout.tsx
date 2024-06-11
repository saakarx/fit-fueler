import { Slot } from 'expo-router';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
} from 'react-native';

import { createBox } from '@shopify/restyle';
import { Box, ScrollView } from '@src/atoms';
import { Theme } from '@src/themes';

const StyledKeyboardAvoidingView = createBox<Theme, KeyboardAvoidingViewProps>(
  KeyboardAvoidingView
);

const Layout = () => {
  return (
    <StyledKeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      enabled={true}
      flex={1}
      bg='$background'
    >
      <ScrollView
        flex={1}
        bg='$background'
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box
          flex={1}
          bg='$background'
          px='lg'
          py='5xl'
          justifyContent='space-between'
        >
          <Slot />
        </Box>
      </ScrollView>
    </StyledKeyboardAvoidingView>
  );
};

export default Layout;
