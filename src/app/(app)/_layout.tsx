import { Redirect, Stack } from 'expo-router';
import React, { Fragment } from 'react';

import BottomBar from '@src/components/bottom-bar';

import { useAuth } from '@src/context/auth';
import BottomBarProvider from '@src/context/bottom-bar';

const RootLayout = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Redirect href='/signin' />;

  return (
    <BottomBarProvider>
      <Layout />
    </BottomBarProvider>
  );
};

const Layout = () => {
  return (
    <Fragment>
      <Stack screenOptions={{ headerShown: false }} />
      <BottomBar />
    </Fragment>
  );
};

export default RootLayout;
