import { Slot } from 'expo-router';
import { Fragment } from 'react';

import { ScrollView } from '@src/atoms';
import BottomBar from '@src/components/bottom-bar';
import BottomBarProvider from '@src/context/bottom-bar';

const RootLayout = () => {
  return (
    <BottomBarProvider>
      <Layout />
    </BottomBarProvider>
  );
};

const Layout = () => {
  return (
    <Fragment>
      <ScrollView flex={1} bg='$background'>
        <Slot />
      </ScrollView>
      <BottomBar />
    </Fragment>
  );
};

export default RootLayout;
