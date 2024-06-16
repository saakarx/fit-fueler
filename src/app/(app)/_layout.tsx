import { Slot } from 'expo-router';
import { Fragment } from 'react';

import { ScrollView } from '@src/atoms';
import BottomBar from '@src/components/bottom-bar';

const RootLayout = () => {
  return <Layout />;
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
