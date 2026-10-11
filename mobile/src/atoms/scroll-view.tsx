import { createBox } from '@shopify/restyle';
import { ScrollViewProps as NativeScrollViewProps } from 'react-native';
import Animated, { AnimatedProps } from 'react-native-reanimated';

import { Theme } from '@src/themes';

const ScrollView = createBox<Theme, AnimatedProps<NativeScrollViewProps>>(
  Animated.ScrollView
);

export type ScrollViewProps = React.ComponentProps<typeof ScrollView>;
export default ScrollView;
