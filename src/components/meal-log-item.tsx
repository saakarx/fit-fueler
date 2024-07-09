import { MinusIcon } from 'lucide-react-native';
import React from 'react';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

import { MealLog } from '@src/firebase';
import { MealTimeT } from '@src/types.type';

const MealLogItem = ({
  meal,
  removeMealLogItem,
}: {
  meal: MealLog;
  removeMealLogItem: (update: {
    id: string;
    mealTime: MealTimeT;
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
      <Box flex={1}>
        <Text fontWeight='500' fontFamily='WorkSans_500Medium' color='purple'>
          {meal.mealName}
        </Text>
        <Text color='$fieldInputPlaceholderTextColor' style={{ flex: 1 }}>
          {meal.cals} KCAL, {meal.protein} G (Protein), {meal.carbohydrates} G
          (Carbs)
        </Text>
      </Box>
      <Box borderRadius='full' overflow='hidden'>
        <TouchableOpacity
          bg='$logItemButtonBg'
          rippleColor='$logItemButtonRippleColor'
          p='sm'
          borderRadius='full'
          onPress={() => {
            removeMealLogItem({
              id: meal.id,
              loggedFor: meal.loggedFor,
              mealTime: meal.mealTime,
            });
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

export default MealLogItem;
