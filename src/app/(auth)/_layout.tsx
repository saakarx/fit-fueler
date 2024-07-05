import { createBox } from '@shopify/restyle';
import { Redirect, Slot } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
} from 'react-native';

import { Box, ScrollView } from '@src/atoms';

import { useAuth } from '@src/context/auth';

import { Theme } from '@src/themes';

const StyledKeyboardAvoidingView = createBox<Theme, KeyboardAvoidingViewProps>(
  KeyboardAvoidingView
);

const Layout = () => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) return <Redirect href='/' />;

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
