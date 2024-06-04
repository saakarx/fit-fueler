import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  useFonts,
} from '@expo-google-fonts/work-sans';
import { ThemeProvider } from '@shopify/restyle';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBar } from '@src/atoms';
import { themes } from '@src/themes';

SplashScreen.preventAutoHideAsync();

const Layout = () => {
  const [fontsLoaded, fontsError] = useFonts({
    WorkSans_400Regular,
    WorkSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeProvider theme={themes[1].theme}>
        <StatusBar />
        <Slot />
      </ThemeProvider>
    </SafeAreaView>
  );
};

export default Layout;
