import { Slot } from 'expo-router';
import { Fragment } from 'react';

import { ScrollView } from '@src/atoms';

const RootLayout = () => {
  return <Layout />;
};

const Layout = () => {
  return (
    <Fragment>
      <ScrollView flex={1} bg='$background'>
        <Slot />
      </ScrollView>
    </Fragment>
  );
};

export default RootLayout;
