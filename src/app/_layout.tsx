import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/work-sans';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@shopify/restyle';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBar } from '@src/atoms';

import { activeThemeAtom } from '@src/states/theme';

import AuthProvider from '@src/context/auth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const Layout = () => {
  const [fontsLoaded, fontsError] = useFonts({
    BricolageGrotesque_400Regular: require('../../assets/BricolageGrotesque-Regular.ttf'),
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold_Italic,
  });
  const activeTheme = useAtomValue(activeThemeAtom);

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={activeTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <SafeAreaView style={{ flex: 1 }}>
                <StatusBar />
                <Stack
                  initialRouteName='/(auth)/index'
                  screenOptions={{ headerShown: false }}
                />
              </SafeAreaView>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Layout;
