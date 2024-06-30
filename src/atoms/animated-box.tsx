import { createBox } from '@shopify/restyle';
import { ViewProps } from 'react-native';
import Animated, { AnimatedProps } from 'react-native-reanimated';

import { Theme } from '@src/themes';

const AnimatedBox = createBox<Theme, AnimatedProps<ViewProps>>(Animated.View);

export type AnimatedBoxProps = React.ComponentProps<typeof AnimatedBox>;
export default AnimatedBox;
