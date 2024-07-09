import { Link, usePathname } from 'expo-router';
import { LucideIcon as LucideIconRN } from 'lucide-react-native';
import React, { FC } from 'react';

import { Box, Pressable, Text } from '@src/atoms';
import LucideIcon from './lucide-icon';

type BottomBarButtonProps = {
  icon: LucideIconRN;
  text: string;
  href: string;
};

const BottomBarButton: FC<BottomBarButtonProps> = ({ icon, text, href }) => {
  const pathname = usePathname();
  const activeRoute = pathname === href;

  return (
    <Link asChild href={href} style={{ minHeight: 54, flex: 1 }}>
      <Pressable>
        <Box
          flex={1}
          alignItems='center'
          justifyContent='center'
          gap='xxs'
          borderWidth={1}
          borderRadius='lg'
          borderColor='$bottomBarItemBorder'
          bg={
            activeRoute ? '$bottomBarActiveItemBg' : '$bottomBarInactiveItemBg'
          }
          p='xs'
        >
          <LucideIcon
            stroke={
              activeRoute ? '$bottomBarActiveItem' : '$bottomBarInactiveItem'
            }
            strokeWidth={activeRoute ? 2 : 1}
            Icon={icon}
            size={24}
          />
          {activeRoute && (
            <Text
              color='$bottomBarActiveItem'
              fontFamily='WorkSans_500Medium'
              fontWeight='500'
              fontSize={11}
            >
              {text}
            </Text>
          )}
        </Box>
      </Pressable>
    </Link>
  );
};

export default BottomBarButton;
