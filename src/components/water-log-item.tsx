import { MinusIcon } from 'lucide-react-native';
import React from 'react';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

import { WaterLog } from '@src/firebase';

const WaterLogItem = ({
  water,
  removeWaterLogItem,
}: {
  water: WaterLog;
  removeWaterLogItem: ({
    id,
    loggedFor,
  }: {
    id: string;
    loggedFor: string;
  }) => void;
}) => {
  return (
    <Box
      bg='$logItemBg'
      p='sm'
      px='lg'
      borderRadius='md'
      gap='xxs'
      flexDirection='row'
      alignItems='center'
      justifyContent='space-between'
    >
      <Box>
        <Text fontWeight='500' fontFamily='WorkSans_500Medium' color='purple'>
          Water
        </Text>
        <Text color='$fieldInputPlaceholderTextColor'>{water.quantity} ml</Text>
      </Box>
      <Box borderRadius='full' overflow='hidden'>
        <TouchableOpacity
          bg='$logItemButtonBg'
          rippleColor='$logItemButtonRippleColor'
          p='sm'
          borderRadius='full'
          onPress={() => {
            removeWaterLogItem({ id: water.id, loggedFor: water.loggedFor });
          }}
        >
          <LucideIcon
            Icon={MinusIcon}
            size={18}
            stroke='$fieldInputPlaceholderTextColor'
          />
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

export default WaterLogItem;
