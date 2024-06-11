import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
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
    BricolageGrotesque_400Regular: require('../../assets/BricolageGrotesque-Regular.ttf'),
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  const activeTheme = themes.find(i => i.id === 'dark') || themes[0]; // TODO:

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeProvider theme={activeTheme.theme}>
        <StatusBar />
        <Slot />
      </ThemeProvider>
    </SafeAreaView>
  );
};

export default Layout;
