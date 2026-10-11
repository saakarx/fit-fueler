import { createBox } from '@shopify/restyle';
import React from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@src/themes';

const SafeAreaView = createBox<Theme, ViewProps>(RNSafeAreaView);

export type SafeAreaViewProps = React.ComponentProps<typeof SafeAreaView>;
export default SafeAreaView;
