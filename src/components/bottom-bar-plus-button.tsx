import { Link } from 'expo-router';
import { DumbbellIcon, PlusIcon, UtensilsIcon } from 'lucide-react-native';
import React, { Fragment, useState } from 'react';
import { Modal } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import { useBottomBar } from '@src/context/bottom-bar';
import LucideIcon from './lucide-icon';

const popoverItems = [
  {
    icon: DumbbellIcon,
    text: 'Log a workout',
    href: '/log-workout',
  },
  {
    icon: UtensilsIcon,
    text: 'Add a meal',
    href: '/log-meal',
  },
];

const BottomBarPlusButton = () => {
  const safeAreaInsets = useSafeAreaInsets();
  const { bottomBarHeight: headerBarHeight } = useBottomBar();
  const [visible, setVisible] = useState<boolean>(false);
  const togglePopover = (visibility: boolean) => {
    setVisible(visibility);
  };

  const bottom = safeAreaInsets.bottom + headerBarHeight + 10;

  return (
    <>
      <Box flex={1} overflow='hidden' borderRadius='lg'>
        <TouchableOpacity
          rippleColor='purple'
          flex={1}
          onPress={() => togglePopover(true)}
        >
          <Box
            flex={1}
            alignItems='center'
            justifyContent='center'
            bg='purple'
            borderWidth={1}
            borderColor='purple'
            borderRadius='lg'
            p='xs'
          >
            <LucideIcon
              Icon={PlusIcon}
              size={24}
              stroke='white'
              strokeWidth={2}
            />
          </Box>
        </TouchableOpacity>
      </Box>

      <Modal transparent={true} animationType='fade' visible={visible}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
          onTouchStart={() => togglePopover(false)}
        >
          <Box
            bg='$background'
            position='absolute'
            bottom={bottom}
            left={0}
            right={0}
            mx='sm'
            p='sm'
            borderRadius='md'
            zIndex={10}
            onTouchStart={e => e.stopPropagation()}
          >
            <Box
              position='absolute'
              left='50%'
              right='50%'
              bottom={-((5 + 5) * 0.866)}
              borderLeftWidth={7}
              borderRightWidth={7}
              borderBottomWidth={(5 + 5) * 0.866}
              borderBottomColor='$background'
              width={0}
              height={0}
              style={{
                transform: [{ rotate: '180deg' }],
                backgroundColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: 'transparent',
              }}
              zIndex={'-10'}
            />

            {popoverItems.map(({ icon, text, href }, idx) => (
              <Fragment key={idx}>
                <Box borderRadius='sm' overflow='hidden'>
                  <Link href={href} asChild>
                    <TouchableOpacity
                      rippleColor='$backgroundRippleColor'
                      flexDirection='row'
                      alignItems='center'
                      gap='md'
                      paddingVertical='sm'
                      paddingHorizontal='md'
                      borderRadius='sm'
                    >
                      <LucideIcon
                        Icon={icon}
                        size={20}
                        stroke='pink'
                        strokeWidth={1.5}
                      />
                      <Text>{text}</Text>
                    </TouchableOpacity>
                  </Link>
                </Box>

                {idx !== popoverItems.length - 1 && (
                  <Box
                    width='95%'
                    borderBottomWidth={1}
                    borderColor='black700'
                    my='xxs'
                    style={{ marginHorizontal: 'auto' }}
                  />
                )}
              </Fragment>
            ))}
          </Box>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default BottomBarPlusButton;
