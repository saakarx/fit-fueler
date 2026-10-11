import {
  CalendarDaysIcon,
  LineChartIcon,
  PentagonIcon,
  UserRoundIcon,
} from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@src/atoms';
import { BoxProps } from '@src/atoms/box';
import BottomBarButton from './bottom-bar-button';
import BottomBarPlusButton from './bottom-bar-plus-button';

import { useBottomBar } from '@src/context/bottom-bar';

const BottomBar: React.FC<BoxProps> = props => {
  const safeAreaInsets = useSafeAreaInsets();
  const { handleBottomBarLayout } = useBottomBar();
  const { ...rest } = props;

  return (
    <Box
      {...rest}
      style={[rest.style, { paddingBottom: safeAreaInsets.bottom }]}
      onLayout={handleBottomBarLayout}
    >
      <Box
        flexDirection='row'
        alignItems='center'
        gap='sm'
        p='sm'
        bg='$bottomBarBg'
        minHeight={44}
      >
        <BottomBarButton icon={PentagonIcon} text='Home' href='/' />
        <BottomBarButton icon={CalendarDaysIcon} text='Logs' href='/logs' />
        <BottomBarPlusButton />
        <BottomBarButton
          icon={LineChartIcon}
          text='Analytics'
          href='/analytics'
        />
        <BottomBarButton icon={UserRoundIcon} text='Profile' href='/profile' />
      </Box>
    </Box>
  );
};

export default BottomBar;
