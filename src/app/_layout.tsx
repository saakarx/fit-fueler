import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/work-sans';
import { ThemeProvider } from '@shopify/restyle';
import { SplashScreen, Stack } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBar } from '@src/atoms';
import { activeThemeAtom } from '@src/states/theme';

SplashScreen.preventAutoHideAsync();

const Layout = () => {
  const [fontsLoaded, fontsError] = useFonts({
    BricolageGrotesque_400Regular: require('../../assets/BricolageGrotesque-Regular.ttf'),
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });
  const activeTheme = useAtomValue(activeThemeAtom);

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemeProvider theme={activeTheme}>
          <StatusBar />
          <Stack
            initialRouteName='(tabs)'
            screenOptions={{ headerShown: false }}
          />
        </ThemeProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Layout;
